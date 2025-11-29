import React, { useState } from 'react'
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi'
import { useToast } from './Toast'

// Placeholder for Aave SDK integration
export default function LendingComponent({ tokenAddress }) {
  const { address, isConnected } = useAccount()
  const toast = useToast()
  const [amount, setAmount] = useState('')
  const [action, setAction] = useState('deposit') // deposit or borrow

  const execute = async () => {
    if (!amount) return
    try {
      // Placeholder: Integrate Aave SDK
      // if (action === 'deposit') await deposit(tokenAddress, amount)
      // else await borrow(tokenAddress, amount)
      toast.success(`${action} initiated`)
    } catch (error) {
      toast.error(`${action} failed: ` + error.message)
    }
  }

  return (
    <div style={{ marginTop: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <h3>Lending/Borrowing (Aave)</h3>
      <select value={action} onChange={(e) => setAction(e.target.value)} style={{ padding: 8, borderRadius: 4, marginRight: 8 }}>
        <option value="deposit">Deposit</option>
        <option value="borrow">Borrow</option>
      </select>
      <input
        type="text"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        style={{ padding: 8, borderRadius: 4, marginRight: 8 }}
      />
      <button onClick={execute} disabled={!isConnected || !amount} style={{ padding: '8px 16px', borderRadius: 4 }}>
        {action}
      </button>
      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
        Note: Requires Aave SDK integration. Placeholder for now.
      </p>
    </div>
  )
}