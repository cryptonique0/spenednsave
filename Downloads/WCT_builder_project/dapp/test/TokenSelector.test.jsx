import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

import TokenSelector from '../src/components/TokenSelector'

const mockTokens = {
  USDC: { address: '0xA0b86...', symbolHint: 'USDC' },
  DAI: { address: '0x6B175...', symbolHint: 'DAI' }
}

describe('TokenSelector', () => {
  it('renders token selector with options', () => {
    const onChange = vi.fn()
    render(<TokenSelector tokens={mockTokens} value="" onChange={onChange} />)
    
    expect(screen.getByText('Select token')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('shows custom address input when allowCustom is true', () => {
    const onChange = vi.fn()
    render(<TokenSelector tokens={mockTokens} value="" onChange={onChange} allowCustom={true} />)
    
    expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument()
  })
})
