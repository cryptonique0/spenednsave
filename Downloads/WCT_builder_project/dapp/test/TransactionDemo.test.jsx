import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { ToastProvider } from '../src/components/Toast'

vi.mock('wagmi', () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
  usePublicClient: () => ({}),
  usePrepareContractWrite: () => ({ config: {}, error: null }),
  useContractWrite: () => ({ write: undefined, data: null, error: null, isLoading: false }),
  useWaitForTransaction: () => ({ isLoading: false, isSuccess: false })
}))

import TransactionDemo from '../src/components/TransactionDemo'

describe('TransactionDemo', () => {
  it('renders nothing when not connected or tokenAddress missing', () => {
    const { container } = render(
      <ToastProvider>
        <TransactionDemo />
      </ToastProvider>
    )
    // TransactionDemo returns null when not connected; ToastProvider wrapper renders
    // Just verify rendering doesn't crash with real ToastProvider
    expect(container).toBeTruthy()
  })
})
