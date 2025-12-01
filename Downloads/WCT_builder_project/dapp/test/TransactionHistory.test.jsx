import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x123' }),
  usePublicClient: () => ({ getTransactionReceipt: vi.fn() })
}))

import TransactionHistory from '../src/components/TransactionHistory'

describe('TransactionHistory', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders transaction history heading', () => {
    render(<TransactionHistory />)
    expect(screen.getByText(/Transaction History/i)).toBeInTheDocument()
  })

  it('shows empty state when no transactions', () => {
    render(<TransactionHistory />)
    expect(screen.getByText(/No transactions yet/i)).toBeInTheDocument()
  })
})
