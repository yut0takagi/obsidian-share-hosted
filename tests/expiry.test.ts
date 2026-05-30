import { describe, it, expect } from 'vitest'
import { expiryToIso } from '../src/util/expiry'

describe('expiryToIso', () => {
  it('returns null for "never"', () => {
    expect(expiryToIso('never')).toBeNull()
  })

  it('returns ISO ~1 day from now for "1d"', () => {
    const now = new Date('2026-05-30T00:00:00Z')
    const result = expiryToIso('1d', now)
    expect(result).toBe('2026-05-31T00:00:00.000Z')
  })

  it('returns ISO ~7 days from now for "7d"', () => {
    const now = new Date('2026-05-30T00:00:00Z')
    expect(expiryToIso('7d', now)).toBe('2026-06-06T00:00:00.000Z')
  })

  it('returns ISO ~30 days for "30d"', () => {
    const now = new Date('2026-05-30T00:00:00Z')
    expect(expiryToIso('30d', now)).toBe('2026-06-29T00:00:00.000Z')
  })
})
