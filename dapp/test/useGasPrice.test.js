import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import * as api from '../src/config/api'
import { useGasPrice, useGasCost, useOptimalGas } from '../src/hooks/useGasPrice'

describe('useGasPrice', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(api, 'fetcher').mockResolvedValue({
      result: {
        SafeGasPrice: 20,
        ProposeGasPrice: 30,
        FastGasPrice: 40
      }
    })
  })

  it('loads slow/standard/fast prices', async () => {
    const { result } = renderHook(() => useGasPrice(1))
    await act(async () => {})
    expect(result.current.loading).toBe(false)
    expect(result.current.gasPrices).toEqual({ slow: 20, standard: 30, fast: 40 })
  })

  it('refreshes every 10s', async () => {
    renderHook(() => useGasPrice(1))
    await act(async () => {})
    expect(api.fetcher).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(10000))
    expect(api.fetcher).toHaveBeenCalledTimes(2)
  })
})

describe('useGasCost', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(api, 'fetcher').mockImplementation(async (url) => {
      if (url.includes('simple/price')) {
        return { ethereum: { usd: 2000 } }
      }
      return { result: { SafeGasPrice: 20, ProposeGasPrice: 30, FastGasPrice: 40 } }
    })
  })

  it('calculates cost in native and USD', async () => {
    const { result } = renderHook(() => useGasCost(1, 21000, 'standard'))
    await act(async () => {})
    expect(result.current.cost).toBeGreaterThan(0)
    expect(result.current.costUSD).toBeGreaterThan(0)
  })
})

describe('useOptimalGas', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(api, 'fetcher').mockResolvedValue({
      result: { SafeGasPrice: 10, ProposeGasPrice: 20, FastGasPrice: 30 }
    })
  })

  it('returns EIP-1559 compatible settings', async () => {
    const { result } = renderHook(() => useOptimalGas(1, 'high'))
    await act(async () => {})
    expect(result.current.settings.speed).toBe('fast')
    expect(result.current.settings.gasPrice).toBe(30)
    expect(result.current.settings.maxFeePerGas).toBeGreaterThan(30)
  })
})
