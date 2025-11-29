import React, { useState, useEffect } from 'react'
import { useAccount, useBalance } from 'wagmi'

export default function UserDashboard() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })
  const [stats, setStats] = useState({
    totalTxs: 0,
    successfulTxs: 0,
    totalGasSpent: '0',
    favoriteTokens: []
  })

  useEffect(() => {
    if (!address) return

    // Load stats from localStorage
    const txHistory = localStorage.getItem(`txHistory_${address}`)
    if (txHistory) {
      const txs = JSON.parse(txHistory)
      setStats({
        totalTxs: txs.length,
        successfulTxs: txs.filter(tx => tx.status === 'confirmed').length,
        totalGasSpent: '~0.05', // Placeholder
        favoriteTokens: ['WCTD', 'ETH']
      })
    }
  }, [address])

  if (!isConnected) return null

  const StatCard = ({ title, value, icon, color }) => (
    <div style={{
      flex: 1,
      minWidth: 200,
      padding: 20,
      borderRadius: 12,
      background: `${color}10`,
      border: `2px solid ${color}30`
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  )

  return (
    <div style={{ padding: 24, background: '#f9fafb', borderRadius: 12, marginTop: 24 }}>
      <h2 style={{ margin: 0, marginBottom: 20, fontSize: 24, fontWeight: 700 }}>
        📊 Your Dashboard
      </h2>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard
          title="Total Transactions"
          value={stats.totalTxs}
          icon="📝"
          color="#3b82f6"
        />
        <StatCard
          title="Successful"
          value={stats.successfulTxs}
          icon="✅"
          color="#10b981"
        />
        <StatCard
          title="Gas Spent"
          value={`${stats.totalGasSpent} ETH`}
          icon="⛽"
          color="#f59e0b"
        />
        <StatCard
          title="Balance"
          value={balance ? `${parseFloat(balance.formatted).toFixed(4)}` : '...'}
          icon="💰"
          color="#8b5cf6"
        />
      </div>

      <div style={{
        padding: 16,
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ margin: 0, marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
          ⭐ Favorite Tokens
        </h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {stats.favoriteTokens.map(token => (
            <div
              key={token}
              style={{
                padding: '6px 12px',
                background: '#f3f4f6',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500
              }}
            >
              {token}
            </div>
          ))}
          <button style={{
            padding: '6px 12px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            cursor: 'pointer'
          }}>
            + Add Token
          </button>
        </div>
      </div>

      <div style={{
        marginTop: 16,
        padding: 16,
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ margin: 0, marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
          🎯 Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button style={{
            padding: '10px 20px',
            background: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600
          }}>
            🎁 Claim Rewards
          </button>
          <button style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600
          }}>
            💸 Send Tokens
          </button>
          <button style={{
            padding: '10px 20px',
            background: '#8b5cf6',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600
          }}>
            📥 Export Data
          </button>
        </div>
      </div>
    </div>
  )
}
