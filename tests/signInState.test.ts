import { describe, it, expect } from 'vitest'
import { newPendingSignIn, callbackUrlFor, checkCallbackState, rememberPending, PENDING_SIGN_IN_TTL_MS, MAX_PENDING_SIGN_INS } from '../src/auth/signInState'

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
  const first = { state: 'abcdefghijklmnopqrstuvwxyz012345', createdAt: NOW }
  const second = { state: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ987654', createdAt: NOW + 30_000 }

  it('accepts the state this device started with', () => {
    expect(checkCallbackState([first], first.state, NOW + 60_000)).toBe('ok')
  })

  it('still accepts the first link after a second one was requested', () => {
    expect(checkCallbackState([first, second], first.state, NOW + 60_000)).toBe('ok')
    expect(checkCallbackState([first, second], second.state, NOW + 60_000)).toBe('ok')
  })

  it('rejects a callback when no sign-in was started here', () => {
    expect(checkCallbackState([], first.state, NOW)).toBe('not_started')
  })

  it('rejects a callback without state', () => {
    expect(checkCallbackState([first], undefined, NOW)).toBe('mismatch')
    expect(checkCallbackState([first], '', NOW)).toBe('mismatch')
  })

  it('rejects a different state', () => {
    expect(checkCallbackState([first], 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz', NOW)).toBe('mismatch')
  })

  it('rejects a sign-in started too long ago', () => {
    expect(checkCallbackState([first], first.state, NOW + PENDING_SIGN_IN_TTL_MS + 1)).toBe('expired')
  })
})

describe('rememberPending', () => {
  it('adds the new request and drops expired ones', () => {
    const old = { state: 'o'.repeat(32), createdAt: NOW - PENDING_SIGN_IN_TTL_MS - 1 }
    const fresh = { state: 'f'.repeat(32), createdAt: NOW - 1000 }
    const next = { state: 'n'.repeat(32), createdAt: NOW }
    expect(rememberPending([old, fresh], next, NOW)).toEqual([fresh, next])
  })

  it(`keeps at most ${MAX_PENDING_SIGN_INS}`, () => {
    let list: { state: string; createdAt: number }[] = []
    for (let i = 0; i < MAX_PENDING_SIGN_INS + 2; i++) list = rememberPending(list, { state: `s${i}`.padEnd(32, 'x'), createdAt: NOW + i }, NOW + i)
    expect(list).toHaveLength(MAX_PENDING_SIGN_INS)
    expect(list[list.length - 1].state.startsWith(`s${MAX_PENDING_SIGN_INS + 1}`)).toBe(true)
  })
})
