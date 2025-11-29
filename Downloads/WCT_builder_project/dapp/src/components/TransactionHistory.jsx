import React, { useState, useEffect, useMemo } from 'react'
import { useAccount, usePublicClient } from 'wagmi'

export default function TransactionHistory() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Load transactions from localStorage
    const stored = localStorage.getItem(`txHistory_${address}`)
    if (stored) {
      setTransactions(JSON.parse(stored))
    }
  }, [address])

  const addTransaction = (hash, type) => {
    const newTx = {
      hash,
      type,
      timestamp: Date.now(),
      status: 'pending'
    }
    const updated = [newTx, ...transactions].slice(0, 20) // Keep last 20
    setTransactions(updated)
    localStorage.setItem(`txHistory_${address}`, JSON.stringify(updated))
  }

  const refreshStatus = async (hash) => {
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash })
      return receipt ? 'confirmed' : 'pending'
    } catch {
      return 'pending'
    }
  }

  const refreshAll = async () => {
    setLoading(true)
    const updated = await Promise.all(
      transactions.map(async (tx) => {
        if (tx.status === 'pending') {
          const status = await refreshStatus(tx.hash)
          return { ...tx, status }
        }
        return tx
      })
    )
    setTransactions(updated)
    localStorage.setItem(`txHistory_${address}`, JSON.stringify(updated))
    setLoading(false)
  }

  const clearHistory = () => {
    setTransactions([])
    localStorage.removeItem(`txHistory_${address}`)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10b981'
      case 'failed': return '#ef4444'
      default: return '#f59e0b'
    }
  }

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'confirmed': return '✅'
      case 'failed': return '❌'
      default: return '⏳'
    }
  }

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (filterType !== 'all' && tx.type !== filterType) return false
      if (filterStatus !== 'all' && tx.status !== filterStatus) return false
      if (search && !tx.hash.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [transactions, filterType, filterStatus, search])

  // CSV export logic (kept outside of the memo so the button can call it)
  const exportCSV = () => {
    if (!filtered.length) return
    const header = ['hash', 'type', 'status', 'timestamp']
    const rows = filtered.map(tx => [tx.hash, tx.type, tx.status, new Date(tx.timestamp).toISOString()])
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'history.csv'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  }

  if (!address) return null

  return (
    <div style={{ marginTop: 24, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Transaction History</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              style={{ padding: '4px 12px', fontSize: 12, borderRadius: 4, cursor: 'pointer' }}
              aria-label="export-csv"
            >
              📄 Export CSV
            </button>
            <button
              onClick={refreshAll}
              disabled={loading || transactions.length === 0}
              style={{ padding: '4px 12px', fontSize: 12, borderRadius: 4, cursor: 'pointer' }}
              aria-label="refresh-transactions"
            >
              {loading ? '⟳' : '🔄'} Refresh
            </button>
            <button
              onClick={clearHistory}
              disabled={transactions.length === 0}
              style={{ padding: '4px 12px', fontSize: 12, borderRadius: 4, cursor: 'pointer' }}
              aria-label="clear-transactions"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: '4px 8px', fontSize: 12, borderRadius: 4 }}
            aria-label="filter-type"
          >
            <option value="all">All Types</option>
            <option value="approve">Approve</option>
            <option value="transfer">Transfer</option>
            <option value="claim">Claim</option>
            <option value="mint">Mint</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '4px 8px', fontSize: 12, borderRadius: 4 }}
            aria-label="filter-status"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="failed">Failed</option>
          </select>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hash"
            aria-label="search-hash"
            style={{ flex: '1 1 240px', padding: '4px 8px', fontSize: 12, borderRadius: 4, border: '1px solid #e5e7eb' }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af', fontSize: 14 }}>
          {transactions.length === 0 ? 'No transactions yet. Start by claiming or transferring tokens!' : 'No transactions match current filters.'}
        </div>
      ) : (
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {filtered.map((tx, i) => (
            <div 
              key={tx.hash} 
              style={{ 
                padding: 12, 
                borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <span style={{ fontSize: 20 }}>{getStatusEmoji(tx.status)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ 
                    fontSize: 12, 
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}>
                    {tx.type}
                  </span>
                  <span style={{ 
                    fontSize: 10, 
                    padding: '2px 6px', 
                    borderRadius: 4,
                    background: getStatusColor(tx.status) + '20',
                    color: getStatusColor(tx.status),
                    textTransform: 'capitalize'
                  }}>
                    {tx.status}
                  </span>
                </div>
                <div style={{ 
                  fontSize: 11, 
                  color: '#6b7280', 
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {tx.hash}
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                  {new Date(tx.timestamp).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => navigator.clipboard.writeText(tx.hash)}
                  style={{ 
                    padding: '4px 8px', 
                    fontSize: 12, 
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1px solid #e5e7eb'
                  }}
                  title="Copy hash"
                >
                  📋
                </button>
                <a
                  href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 4,
                    textDecoration: 'none',
                    border: '1px solid #e5e7eb',
                    display: 'inline-block'
                  }}
                  title="View on Etherscan"
                >
                  🔍
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Export helper function to add transactions from other components
export const addToHistory = (address, hash, type) => {
  const key = `txHistory_${address}`
  const stored = localStorage.getItem(key)
  const history = stored ? JSON.parse(stored) : []
  const newTx = { hash, type, timestamp: Date.now(), status: 'pending' }
  const updated = [newTx, ...history].slice(0, 20)
  localStorage.setItem(key, JSON.stringify(updated))
}
