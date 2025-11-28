import React, { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'

export default function GasEstimator({ contractAddress, functionName, args = [] }) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [gasEstimate, setGasEstimate] = useState(null)
  const [gasPrice, setGasPrice] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isConnected || !contractAddress) return

    async function estimateGas() {
      setLoading(true)
      try {
        const price = await publicClient.getGasPrice()
        setGasPrice(price)

        // Estimate gas cost in ETH
        const estimatedGas = 100000n // Approximate gas for ERC20 operations
        const cost = (estimatedGas * price) / 10n**18n
        
        setGasEstimate({
          gas: estimatedGas.toString(),
          costEth: cost.toString(),
          costGwei: (price / 10n**9n).toString()
        })
      } catch (error) {
        console.error('Gas estimation failed:', error)
      } finally {
        setLoading(false)
      }
    }

    estimateGas()
  }, [isConnected, contractAddress, publicClient])

  if (!gasEstimate || loading) {
    return null
  }

  return (
    <div style={{
      marginTop: 8,
      padding: 8,
      borderRadius: 6,
      background: '#f3f4f6',
      fontSize: 12,
      color: '#6b7280'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>⛽ Estimated gas:</span>
        <span style={{ fontWeight: 600 }}>
          ~{parseFloat(gasEstimate.costEth).toFixed(6)} ETH ({gasEstimate.costGwei} Gwei)
        </span>
      </div>
    </div>
  )
}
