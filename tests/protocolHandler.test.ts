import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Notice } from 'obsidian'
import { registerAuthCallback } from '../src/auth/ProtocolHandler'
import { TokenStore } from '../src/auth/TokenStore'
import { newPendingSignIn } from '../src/auth/signInState'

vi.mock('../src/auth/ProfileSync', () => ({ syncProfile: vi.fn(async () => {}) }))

function fakePlugin() {
  const secrets = new Map<string, string>()
  const settings: any = { signedInEmail: '', pendingSignIn: null, serverOrg: { domain: 'old.example', available: true } }
  let handler: (params: Record<string, string>) => Promise<void> = async () => {}
  const plugin: any = {
    settings,
    saveSettings: vi.fn(async () => {}),
    registerObsidianProtocolHandler: (_action: string, h: typeof handler) => { handler = h },
  }
  plugin.tokens = new TokenStore({ getSecret: (id) => secrets.get(id) ?? null, setSecret: (id, v) => { secrets.set(id, v) } }, settings, plugin.saveSettings)
  registerAuthCallback(plugin)
  return { plugin, call: (p: Record<string, string>) => handler(p) }
}

beforeEach(() => { (Notice as any).messages = [] })

describe('auth callback wiring', () => {
  it('stores the token for the sign-in started on this device and clears the pending state', async () => {
    const { plugin, call } = fakePlugin()
    plugin.settings.pendingSignIn = newPendingSignIn(Date.now())
    await call({ action: 'share-hosted/auth-callback', api_token: 's_good', email: 'alice@example.com', state: plugin.settings.pendingSignIn.state })
    expect(plugin.tokens.get()).toBe('s_good')
    expect(plugin.settings.signedInEmail).toBe('alice@example.com')
    expect(plugin.settings.pendingSignIn).toBeNull()
    expect(plugin.settings.serverOrg).toBeNull()
  })

  it('ignores a callback this device did not ask for', async () => {
    const { plugin, call } = fakePlugin()
    await call({ action: 'share-hosted/auth-callback', api_token: 's_attacker', email: 'mallory@example.net', state: 'abcdefghijklmnopqrstuvwxyz012345' })
    expect(plugin.tokens.get()).toBe('')
    expect(plugin.settings.signedInEmail).toBe('')
    expect((Notice as any).messages.join(' ')).toMatch(/not requested from this device/)
  })

  it('ignores a callback with a different state', async () => {
    const { plugin, call } = fakePlugin()
    plugin.settings.pendingSignIn = newPendingSignIn(Date.now())
    await call({ action: 'share-hosted/auth-callback', api_token: 's_attacker', email: 'mallory@example.net', state: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' })
    expect(plugin.tokens.get()).toBe('')
    expect(plugin.settings.signedInEmail).toBe('')
    expect(plugin.settings.pendingSignIn).not.toBeNull()
  })
})
