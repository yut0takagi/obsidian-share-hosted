import { describe, it, expect } from 'vitest'
import { modalDefaults, resolveExpiry } from '../src/ui/shareDefaults'
import { orgTarget } from '../src/settings/orgDomain'

const NOW = new Date('2026-10-16T00:00:00.000Z')
const settings = { defaultMode: 'org' as const, defaultExpiry: '7d' as const }
const org = orgTarget('alice@example.com')

describe('modalDefaults', () => {
  it('uses settings for a first share', () => {
    expect(modalDefaults({ info: null, existingMode: null, settings, org, now: NOW })).toEqual({
      mode: 'org', audienceText: '', expiry: '7d', keepUntil: null,
    })
  })

  it('pre-fills recipients, mode and the current expiry when re-sharing', () => {
    const info = { mode: 'list' as const, audience: ['bob@example.com', 'carol@example.com'], expires_at: '2026-10-20T00:00:00.000Z' }
    expect(modalDefaults({ info, existingMode: 'list', settings, org, now: NOW })).toEqual({
      mode: 'list', audienceText: 'bob@example.com\ncarol@example.com', expiry: 'keep', keepUntil: '2026-10-20T00:00:00.000Z',
    })
  })

  it('keeps "never" for shares without expiry', () => {
    const info = { mode: 'public' as const, audience: [], expires_at: null }
    expect(modalDefaults({ info, existingMode: 'public', settings, org, now: NOW }).expiry).toBe('never')
  })

  it('falls back to the default expiry when the old one has passed', () => {
    const info = { mode: 'public' as const, audience: [], expires_at: '2026-10-01T00:00:00.000Z' }
    expect(modalDefaults({ info, existingMode: 'public', settings, org, now: NOW })).toMatchObject({ expiry: '7d', keepUntil: null })
  })

  it('falls back to the frontmatter mode when the Worker cannot say (older Worker)', () => {
    expect(modalDefaults({ info: null, existingMode: 'public', settings, org, now: NOW }).mode).toBe('public')
  })

  it('does not pre-select org mode when it is unavailable', () => {
    const gmail = orgTarget('gina@gmail.com')
    expect(modalDefaults({ info: null, existingMode: null, settings, org: gmail, now: NOW }).mode).toBe('list')
  })
})

describe('resolveExpiry', () => {
  it('keeps the previous expiry', () => {
    expect(resolveExpiry('keep', '2026-10-20T00:00:00.000Z', NOW)).toBe('2026-10-20T00:00:00.000Z')
  })
  it('computes relative choices from now', () => {
    expect(resolveExpiry('1d', null, NOW)).toBe('2026-10-17T00:00:00.000Z')
    expect(resolveExpiry('never', null, NOW)).toBeNull()
  })
})
