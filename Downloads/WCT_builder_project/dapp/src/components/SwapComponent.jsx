import React, { useState } from 'react'
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi'
import { useToast } from './Toast'

// Placeholder for Uniswap SDK integration
export default function SwapComponent({ tokenIn, tokenOut }) {
  const { address, isConnected } = useAccount()
  const toast = useToast()
  const [amountIn, setAmountIn] = useState('')
  const [slippage, setSlippage] = useState('0.5') // 0.5%
  const [gasEstimate, setGasEstimate] = useState('')

  const swap = async () => {
    if (!amountIn) return
    try {
      // Placeholder: Integrate Uniswap SDK
      // const swapParams = await getSwapParams(tokenIn, tokenOut, amountIn, slippage)
      // const tx = await executeSwap(swapParams)
      toast.success('Swap initiated')
    } catch (error) {
      toast.error('Swap failed: ' + error.message)
    }
  }

  return (
    <div style={{ marginTop: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <h3>Token Swap (Uniswap)</h3>
      <input
        type="text"
        value={amountIn}
        onChange={(e) => setAmountIn(e.target.value)}
        placeholder="Amount to swap"
        style={{ padding: 8, borderRadius: 4, marginRight: 8 }}
      />
      <input
        type="text"
        value={slippage}
        onChange={(e) => setSlippage(e.target.value)}
        placeholder="Slippage %"
        style={{ padding: 8, borderRadius: 4, marginRight: 8 }}
      />
      <button onClick={swap} disabled={!isConnected || !amountIn} style={{ padding: '8px 16px', borderRadius: 4 }}>
        Swap
      </button>
      {gasEstimate && <p>Estimated Gas: {gasEstimate}</p>}
      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
        Note: Requires Uniswap SDK integration. Placeholder for now.
      </p>
    </div>
  )
}