import { describe, it, expect } from 'vitest'
import { evaluateAuthCallback, magicLinkRequestBody } from '../src/auth/callback'

const NOW = 1_800_000_000_000
const pending = { state: 'abcdefghijklmnopqrstuvwxyz012345', createdAt: NOW - 60_000 }

describe('evaluateAuthCallback', () => {
  it('accepts a callback for the sign-in started on this device', () => {
    expect(evaluateAuthCallback({ api_token: 's_tok', email: 'alice@example.com', state: pending.state }, pending, NOW))
      .toEqual({ ok: true, token: 's_tok', email: 'alice@example.com' })
  })

  it('refuses a callback without a pending sign-in (e.g. a link someone sent)', () => {
    const r = evaluateAuthCallback({ api_token: 's_attacker', email: 'mallory@example.net', state: pending.state }, null, NOW)
    expect(r.ok).toBe(false)
  })

  it('refuses a callback whose state does not match', () => {
    const r = evaluateAuthCallback({ api_token: 's_attacker', email: 'mallory@example.net', state: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' }, pending, NOW)
    expect(r).toMatchObject({ ok: false })
  })

  it('refuses a callback without state', () => {
    expect(evaluateAuthCallback({ api_token: 's_tok', email: 'alice@example.com' }, pending, NOW).ok).toBe(false)
  })

  it('refuses a callback missing the token or email', () => {
    expect(evaluateAuthCallback({ email: 'alice@example.com', state: pending.state }, pending, NOW).ok).toBe(false)
    expect(evaluateAuthCallback({ api_token: 's_tok', state: pending.state }, pending, NOW).ok).toBe(false)
  })

  it('explains each refusal', () => {
    const r = evaluateAuthCallback({ api_token: 's_tok', email: 'alice@example.com', state: 'x' }, pending, NOW)
    expect(r.ok === false && r.message).toMatch(/sign-in/i)
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
