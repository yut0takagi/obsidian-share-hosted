import { describe, it, expect } from 'vitest'
import { emailDomain, isFreeMailDomain, orgTarget, effectiveDefaultMode } from '../src/settings/orgDomain'

describe('emailDomain', () => {
  it('returns the lower-cased domain', () => {
    expect(emailDomain('Alice@Example.COM')).toBe('example.com')
  })
  it('returns an empty string when signed out', () => {
    expect(emailDomain('')).toBe('')
  })
})

describe('isFreeMailDomain', () => {
  it.each(['gmail.com', 'outlook.com', 'yahoo.co.jp', 'icloud.com'])('%s is free mail', (d) => {
    expect(isFreeMailDomain(d)).toBe(true)
  })
  it('an organization domain is not', () => {
    expect(isFreeMailDomain('example.com')).toBe(false)
  })
})

describe('orgTarget', () => {
  it('targets the sign-in domain', () => {
    expect(orgTarget('alice@example.com')).toEqual({ domain: 'example.com', available: true, label: 'Anyone at @example.com', reason: '' })
  })

  it('is unavailable for free mail, with a reason', () => {
    const t = orgTarget('freemail-test-user@gmail.com')
    expect(t.available).toBe(false)
    expect(t.label).toBe('')
    expect(t.reason).toContain('@gmail.com')
  })

  it('is unavailable when signed out', () => {
    expect(orgTarget('').available).toBe(false)
  })

  it('prefers what the Worker reports', () => {
    expect(orgTarget('alice@example.com', { domain: 'example.com', available: false }).available).toBe(false)
  })
})

describe('effectiveDefaultMode', () => {
  it('keeps org when it is available', () => {
    expect(effectiveDefaultMode('org', orgTarget('alice@example.com'))).toBe('org')
  })
  it('falls back to specific people when org is not available', () => {
    expect(effectiveDefaultMode('org', orgTarget('freemail-test-user@gmail.com'))).toBe('list')
  })
  it('leaves other modes alone', () => {
    expect(effectiveDefaultMode('public', orgTarget('freemail-test-user@gmail.com'))).toBe('public')
  })
})
