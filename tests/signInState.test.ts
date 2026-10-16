import { describe, it, expect } from 'vitest'
import { newPendingSignIn, callbackUrlFor, checkCallbackState, PENDING_SIGN_IN_TTL_MS } from '../src/auth/signInState'

const NOW = 1_800_000_000_000

describe('newPendingSignIn', () => {
  it('makes a random URL-safe state the Worker accepts', () => {
    const a = newPendingSignIn(NOW)
    const b = newPendingSignIn(NOW)
    expect(a.state).toMatch(/^[A-Za-z0-9_-]{32,128}$/)
    expect(a.state).not.toBe(b.state)
    expect(a.createdAt).toBe(NOW)
  })
})

describe('callbackUrlFor', () => {
  it('carries the state on the callback so older Workers pass it back too', () => {
    const url = new URL(callbackUrlFor('abcdefghijklmnopqrstuvwxyz012345'))
    expect(`${url.protocol}//${url.host}${url.pathname}`).toBe('obsidian://share-hosted/auth-callback')
    expect(url.searchParams.get('state')).toBe('abcdefghijklmnopqrstuvwxyz012345')
  })
})

describe('checkCallbackState', () => {
  const pending = { state: 'abcdefghijklmnopqrstuvwxyz012345', createdAt: NOW }

  it('accepts the state this device started with', () => {
    expect(checkCallbackState(pending, pending.state, NOW + 60_000)).toBe('ok')
  })

  it('rejects a callback when no sign-in was started here', () => {
    expect(checkCallbackState(null, pending.state, NOW)).toBe('not_started')
  })

  it('rejects a callback without state', () => {
    expect(checkCallbackState(pending, undefined, NOW)).toBe('mismatch')
    expect(checkCallbackState(pending, '', NOW)).toBe('mismatch')
  })

  it('rejects a different state', () => {
    expect(checkCallbackState(pending, 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz', NOW)).toBe('mismatch')
  })

  it('rejects a sign-in started too long ago', () => {
    expect(checkCallbackState(pending, pending.state, NOW + PENDING_SIGN_IN_TTL_MS + 1)).toBe('expired')
  })
})
