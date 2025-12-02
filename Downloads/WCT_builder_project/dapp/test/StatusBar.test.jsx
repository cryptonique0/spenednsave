import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('wagmi', () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
  useNetwork: () => ({ chain: null })
}))

vi.mock('../src/lib/format', () => ({
  formatAddress: (addr) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`
}))

import StatusBar from '../src/components/StatusBar'

describe('StatusBar', () => {
  it('shows not connected status when disconnected', () => {
    render(<StatusBar />)
    expect(screen.getByText(/Not connected/i)).toBeInTheDocument()
  })
})
