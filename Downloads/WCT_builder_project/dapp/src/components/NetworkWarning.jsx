import React from 'react'
import { useAccount, useNetwork } from 'wagmi'

export default function NetworkWarning() {
  const { isConnected } = useAccount()
  const { chain } = useNetwork()

  const recommendedNetworks = [11155111] // Sepolia
  const isRecommendedNetwork = chain && recommendedNetworks.includes(chain.id)

  if (!isConnected || isRecommendedNetwork) {
    return null
  }

  return (
    <div style={{
      padding: 16,
      marginBottom: 16,
      borderRadius: 8,
      background: '#fef3c7',
      border: '1px solid #f59e0b',
      display: 'flex',
      alignItems: 'start',
      gap: 12
    }}>
      <span style={{ fontSize: 24 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          Network Notice
        </div>
        <div style={{ fontSize: 14, color: '#92400e', lineHeight: 1.5 }}>
          You're currently on {chain?.name || 'an unsupported network'}. 
          For the best experience and to test features safely, please switch to <strong>Sepolia testnet</strong>.
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#78350f' }}>
          Need testnet ETH? Visit <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" style={{ color: '#92400e', textDecoration: 'underline' }}>sepoliafaucet.com</a>
        </div>
      </div>
    </div>
  )
}
