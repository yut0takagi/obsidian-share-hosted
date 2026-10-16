import { describe, it, expect } from 'vitest'
import { evaluateAuthCallback, magicLinkRequestBody } from '../src/auth/callback'

const NOW = 1_800_000_000_000
const pending = { state: 'abcdefghijklmnopqrstuvwxyz012345', createdAt: NOW - 60_000 }
const pendingList = [pending]

describe('evaluateAuthCallback', () => {
  it('accepts a callback for the sign-in started on this device', () => {
    expect(evaluateAuthCallback({ api_token: 's_tok', email: 'alice@example.com', state: pending.state }, pendingList, NOW))
      .toEqual({ ok: true, kind: 'token', token: 's_tok', email: 'alice@example.com' })
  })

  it('refuses a callback without a pending sign-in (e.g. a link someone sent)', () => {
    const r = evaluateAuthCallback({ api_token: 's_attacker', email: 'mallory@example.net', state: pending.state }, [], NOW)
    expect(r.ok).toBe(false)
  })

  it('refuses a callback whose state does not match', () => {
    const r = evaluateAuthCallback({ api_token: 's_attacker', email: 'mallory@example.net', state: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' }, pendingList, NOW)
    expect(r).toMatchObject({ ok: false })
  })

  it('refuses a callback without state', () => {
    expect(evaluateAuthCallback({ api_token: 's_tok', email: 'alice@example.com' }, pendingList, NOW).ok).toBe(false)
  })

  it('refuses a callback missing the token or email', () => {
    expect(evaluateAuthCallback({ email: 'alice@example.com', state: pending.state }, pendingList, NOW).ok).toBe(false)
    expect(evaluateAuthCallback({ api_token: 's_tok', state: pending.state }, pendingList, NOW).ok).toBe(false)
  })

  it('explains each refusal', () => {
    const r = evaluateAuthCallback({ api_token: 's_tok', email: 'alice@example.com', state: 'x' }, pendingList, NOW)
    expect(r.ok === false && r.message).toMatch(/sign-in/i)
  })
})

describe('evaluateAuthCallback with a one-time code (0.2.0 Worker)', () => {
  it('accepts a code for a sign-in started here, to be exchanged', () => {
    expect(evaluateAuthCallback({ code: 'c_abc', state: pending.state }, pendingList, NOW))
      .toEqual({ ok: true, kind: 'code', code: 'c_abc', state: pending.state })
  })

  it('refuses a code with an unknown state', () => {
    expect(evaluateAuthCallback({ code: 'c_abc', state: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' }, pendingList, NOW).ok).toBe(false)
  })
})

describe('magicLinkRequestBody', () => {
  it('sends the state both as a field and on the callback URL', () => {
    const body = magicLinkRequestBody('alice@example.com', pending)
    expect(body.email).toBe('alice@example.com')
    expect(body.state).toBe(pending.state)
    expect(new URL(body.callback).searchParams.get('state')).toBe(pending.state)
    expect(body.callback.startsWith('obsidian://share-hosted/auth-callback?')).toBe(true)
  })
})
