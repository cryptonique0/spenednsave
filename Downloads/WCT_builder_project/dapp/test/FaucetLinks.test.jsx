import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x123', isConnected: true }),
  useBalance: () => ({ data: null }),
  useNetwork: () => ({ chain: { id: 11155111, name: 'Sepolia' } })
}))

import FaucetLinks from '../src/components/FaucetLinks'

describe('FaucetLinks', () => {
  it('renders faucet links heading', () => {
    render(<FaucetLinks />)
    expect(screen.getByText(/Sepolia Faucets/i)).toBeInTheDocument()
  })
})
