import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import * as api from '../src/config/api'
import { useTokenPrice, useTokenPrices } from '../src/hooks/useTokenPrice'

describe('useTokenPrice', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({})
    })
    vi.spyOn(api, 'fetcher').mockResolvedValue({
      '0xabc...def': { usd: 1.23, usd_24h_change: 4.56 }
    })
  })

  it('fetches price and 24h change', async () => {
    const { result } = renderHook(() => useTokenPrice('0xAbC...Def', 42220))

    expect(result.current.loading).toBe(true)

    await act(async () => {
      // flush effects
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.price).toBeDefined()
    expect(typeof result.current.price).toBe('number')
    expect(typeof result.current.priceChange24h).toBe('number')
  })

  it('auto-refreshes every 30s', async () => {
    renderHook(() => useTokenPrice('0xAbC...Def', 42220))
    await act(async () => {})
    expect(api.fetcher).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(30000)
    })

    expect(api.fetcher).toHaveBeenCalledTimes(2)
  })
})

describe('useTokenPrices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(api, 'fetcher').mockResolvedValue({
      '0x111': { usd: 10, usd_24h_change: 1 },
      '0x222': { usd: 20, usd_24h_change: -2 }
    })
  })

  it('fetches multiple token prices grouped by platform', async () => {
    const tokens = [
      { address: '0x111', chainId: 42220 },
      { address: '0x222', chainId: 1 }
    ]

    const { result } = renderHook(() => useTokenPrices(tokens))
    await act(async () => {})

    expect(result.current.loading).toBe(false)
    expect(Object.keys(result.current.prices).length).toBeGreaterThan(0)
  })

  it('refreshes every 30s', async () => {
    const { result } = renderHook(() => useTokenPrices([{ address: '0x111', chainId: 1 }]))
    await act(async () => {})
    expect(result.current.loading).toBe(false)

    act(() => vi.advanceTimersByTime(30000))
    expect(api.fetcher).toHaveBeenCalledTimes(2)
  })
})
