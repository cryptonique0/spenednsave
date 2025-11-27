import React, { useEffect, useMemo, useState } from 'react'
import { useAccount, usePublicClient, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from 'wagmi'
import { erc20Abi } from '../abi/erc20'
import { parseUnits } from 'viem'

export default function TransactionDemo({ tokenAddress }) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [decimals, setDecimals] = useState(18)
  const [symbol, setSymbol] = useState('')

  const [spender, setSpender] = useState('')
  const [approveAmount, setApproveAmount] = useState('0.01')

  const [to, setTo] = useState('')
  const [transferAmount, setTransferAmount] = useState('0.001')

  // Validation helpers
  const isAddress = (v) => /^0x[a-fA-F0-9]{40}$/.test(v.trim())
  const isPositiveNumber = (v) => {
    if (!v) return false
    return /^\d*\.?\d+$/.test(v) && parseFloat(v) > 0
  }

  const approveAddressValid = isAddress(spender)
  const approveAmountValid = isPositiveNumber(approveAmount)
  const transferAddressValid = isAddress(to)
  const transferAmountValid = isPositiveNumber(transferAmount)
  useEffect(() => {
    async function load() {
      if (!tokenAddress) return
      try {
        const [sym, dec] = await Promise.all([
          publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: 'symbol' }),
          publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: 'decimals' }),
        ])
        setSymbol(sym)
        setDecimals(Number(dec))
      } catch (e) {
        // ignore; UI will still render, but inputs may fail if decimals unknown
      }
    }
    load()
  }, [tokenAddress, publicClient])

  const approveArgs = useMemo(() => {
    if (!approveAddressValid || !approveAmountValid) return undefined
    try {
      return [spender, parseUnits(approveAmount || '0', decimals)]
    } catch {
      return undefined
    }
  }, [spender, approveAmount, decimals, approveAddressValid, approveAmountValid])

  const transferArgs = useMemo(() => {
    if (!transferAddressValid || !transferAmountValid) return undefined
    try {
      return [to, parseUnits(transferAmount || '0', decimals)]
    } catch {
      return undefined
    }
  }, [to, transferAmount, decimals, transferAddressValid, transferAmountValid])

  const { config: approveConfig, error: approvePrepError } = usePrepareContractWrite({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: approveArgs,
    enabled: isConnected && !!tokenAddress && !!approveArgs,
  })
  const { write: writeApprove, data: approveTx, error: approveError, isLoading: isApproving } = useContractWrite(approveConfig)
  const { isLoading: approveMining, isSuccess: approveSuccess } = useWaitForTransaction({ hash: approveTx?.hash })

  const { config: transferConfig, error: transferPrepError } = usePrepareContractWrite({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'transfer',
    args: transferArgs,
    enabled: isConnected && !!tokenAddress && !!transferArgs,
  })
  const { write: writeTransfer, data: transferTx, error: transferError, isLoading: isTransferring } = useContractWrite(transferConfig)
  const { isLoading: transferMining, isSuccess: transferSuccess } = useWaitForTransaction({ hash: transferTx?.hash })

  if (!isConnected || !tokenAddress) return null

  return (
    <div style={{ marginTop: 16 }}>
      <h3>Contract write demo ({symbol || 'ERC20'})</h3>
      <div style={{ fontSize: 12, color: '#6b7280' }}>Decimals: {decimals}</div>

      <div style={{ marginTop: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <strong>Approve</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            aria-label="approve-spender"
            placeholder="spender 0x..."
            value={spender}
            onChange={(e) => setSpender(e.target.value)}
            style={{ flex: '1 1 260px', padding: 6, borderRadius: 6, border: '1px solid #ccc' }}
          />
          <input
            type="text"
            aria-label="approve-amount"
            placeholder="amount (e.g. 0.01)"
            value={approveAmount}
            onChange={(e) => setApproveAmount(e.target.value)}
            style={{ width: 160, padding: 6, borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button
            aria-label="approve-button"
            title="Approve token allowance"
            onClick={() => writeApprove?.()}
            disabled={!writeApprove || isApproving || approveMining || !approveAddressValid || !approveAmountValid}
          >
            {isApproving || approveMining ? 'Approving…' : 'Approve'}
          </button>
        </div>
        {(!approveAddressValid || !approveAmountValid) && (
          <div style={{ marginTop: 8, color: '#b45309' }}>
            {!approveAddressValid && 'Invalid spender address. '}
            {!approveAmountValid && 'Enter a positive amount.'}
          </div>
        )}
        {(approvePrepError || approveError) && (
          <div style={{ marginTop: 8, color: 'red' }}>{(approvePrepError || approveError)?.message}</div>
        )}
        {approveSuccess && (
          <TxSuccess hash={approveTx?.hash} label="Approve" />
        )}
      </div>

      <div style={{ marginTop: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <strong>Transfer</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            aria-label="transfer-recipient"
            placeholder="recipient 0x..."
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{ flex: '1 1 260px', padding: 6, borderRadius: 6, border: '1px solid #ccc' }}
          />
          <input
            type="text"
            aria-label="transfer-amount"
            placeholder="amount (e.g. 0.001)"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            style={{ width: 160, padding: 6, borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button
            aria-label="transfer-button"
            title="Transfer tokens to recipient"
            onClick={() => writeTransfer?.()}
            disabled={!writeTransfer || isTransferring || transferMining || !transferAddressValid || !transferAmountValid}
          >
            {isTransferring || transferMining ? 'Transferring…' : 'Transfer'}
          </button>
        </div>
        {(!transferAddressValid || !transferAmountValid) && (
          <div style={{ marginTop: 8, color: '#b45309' }}>
            {!transferAddressValid && 'Invalid recipient address. '}
            {!transferAmountValid && 'Enter a positive amount.'}
          </div>
        )}
        {(transferPrepError || transferError) && (
          <div style={{ marginTop: 8, color: 'red' }}>{(transferPrepError || transferError)?.message}</div>
        )}
        {transferSuccess && (
          <TxSuccess hash={transferTx?.hash} label="Transfer" />
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
        Demo only—double-check addresses and amounts. You’ll confirm in your wallet before anything is sent.
      </div>
    </div>
  )
}

function TxSuccess({ hash, label }) {
  if (!hash) return null
  const explorer = `https://explorer.celo.org/alfajores/tx/${hash}`
  function copy() {
    navigator.clipboard.writeText(hash).catch(() => {})
  }
  return (
    <div style={{ marginTop: 8, color: 'green' }}>
      {label} tx confirmed: {hash}
      <div style={{ marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={copy} style={{ padding: '4px 8px' }}>Copy hash</button>
        <a href={explorer} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
          View on Explorer
        </a>
      </div>
    </div>
  )
}
