import React, { useEffect, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { erc20Abi } from '../abi/erc20'

export default function BalanceOf({ tokenAddress, label = 'Token' }) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [symbol, setSymbol] = useState('')
  const [decimals, setDecimals] = useState(18)
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      if (!isConnected || !address || !tokenAddress) return
      setLoading(true)
      setError(null)
      try {
        const [sym, dec, bal] = await Promise.all([
          publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: 'symbol' }),
          publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: 'decimals' }),
          publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: 'balanceOf', args: [address] }),
        ])
        setSymbol(sym)
        setDecimals(Number(dec))
        setBalance(bal)
      } catch (e) {
        setError(e?.message || String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isConnected, address, tokenAddress, publicClient])

  if (!isConnected) return null

  const formatted = balance != null ? Number(balance) / 10 ** decimals : null

  return (
    <div style={{ marginTop: 16 }}>
      <h3>{label} balance</h3>
      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {!loading && !error && balance != null && (
        <div>{formatted} {symbol || ''}</div>
      )}
    </div>
  )
}
