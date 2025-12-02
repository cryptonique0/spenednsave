import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import * as api from '../src/config/api'
import { useENS, useENSAvatar, useENSMetadata, useENSAvailability, useENSExpiry } from '../src/hooks/useENS'

describe('useENS', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(api, 'fetcher').mockImplementation(async (url) => {
      if (url.includes('/resolve/')) {
        return { address: '0x1234567890abcdef1234567890abcdef12345678' }
      }
      if (url.includes('/reverse/')) {
        return { name: 'alice.eth' }
      }
      return {}
    })
  })

  it('resolves ENS name to address', async () => {
    const { result } = renderHook(() => useENS('alice.eth'))
    await act(async () => {})
    expect(result.current.loading).toBe(false)
    expect(result.current.resolved).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })

  it('reverse resolves address to name', async () => {
    const { result } = renderHook(() => useENS('0x1234567890abcdef1234567890abcdef12345678', true))
    await act(async () => {})
    expect(result.current.loading).toBe(false)
    expect(result.current.resolved).toBe('alice.eth')
  })
})

describe('useENSAvatar', () => {
  beforeEach(() => {
    vi.spyOn(api, 'fetcher').mockResolvedValue({ avatar: 'https://example.com/avatar.png' })
  })

  it('returns avatar url', async () => {
    const { result } = renderHook(() => useENSAvatar('alice.eth'))
    await act(async () => {})
    expect(result.current.avatar).toContain('http')
  })
})

describe('useENSMetadata', () => {
  beforeEach(() => {
    vi.spyOn(api, 'fetcher').mockResolvedValue({ name: 'alice.eth', twitter: '@alice' })
  })

  it('returns metadata fields', async () => {
    const { result } = renderHook(() => useENSMetadata('alice.eth'))
    await act(async () => {})
    expect(result.current.metadata.name).toBe('alice.eth')
    expect(result.current.metadata.twitter).toBe('@alice')
  })
})

describe('useENSAvailability', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(api, 'fetcher').mockResolvedValue({ available: true })
  })

  it('checks availability when valid name', async () => {
    const { result } = renderHook(() => useENSAvailability('newname.eth'))
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.isValid).toBe(true)
    expect(result.current.available).toBe(true)
  })
})

describe('useENSExpiry', () => {
  beforeEach(() => {
    const future = Math.floor(Date.now() / 1000) + 86400
    vi.spyOn(api, 'fetcher').mockResolvedValue({ expiry: future })
  })

  it('returns expiry info', async () => {
    const { result } = renderHook(() => useENSExpiry('alice.eth'))
    await act(async () => {})
    expect(result.current.expiry.isExpired).toBe(false)
    expect(result.current.expiry.daysUntilExpiry).toBeGreaterThan(0)
  })
})
