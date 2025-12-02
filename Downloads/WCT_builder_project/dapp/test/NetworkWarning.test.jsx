import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

vi.mock('wagmi', () => ({
  useAccount: () => ({ isConnected: false }),
  useNetwork: () => ({ chain: null })
}))

import NetworkWarning from '../src/components/NetworkWarning'

describe('NetworkWarning', () => {
  it('renders nothing when not connected', () => {
    const { container } = render(<NetworkWarning />)
    expect(container.firstChild).toBeNull()
  })
})
