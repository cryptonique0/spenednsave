import React from 'react'
import { useNetwork, useSwitchNetwork } from 'wagmi'
import { alfajores } from '../config/chains'

export default function SwitchNetwork() {
  const { chain } = useNetwork()
  const { switchNetworkAsync, isLoading, error, pendingChainId } = useSwitchNetwork()

  const wrongChain = chain && chain.id !== alfajores.id

  if (!wrongChain) return null

  async function onSwitch() {
    try {
      await switchNetworkAsync?.(alfajores.id)
    } catch (e) {
      // ignored; error is handled via hook state
    }
  }

  return (
    <div style={{ marginTop: 12, padding: 8, border: '1px solid #fca5a5', background: '#fef2f2', borderRadius: 6 }}>
      <div style={{ marginBottom: 8 }}>You're connected to the wrong network (current id: {chain?.id}).</div>
      <button onClick={onSwitch} disabled={isLoading || pendingChainId === alfajores.id}>
        {isLoading ? 'Switching…' : 'Switch to Celo Alfajores'}
      </button>
      {error && <div style={{ color: '#b91c1c', marginTop: 8 }}>Error: {error.message}</div>}
    </div>
  )
}
