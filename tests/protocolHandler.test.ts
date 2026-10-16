import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Notice } from 'obsidian'
import { registerAuthCallback } from '../src/auth/ProtocolHandler'
import { TokenStore } from '../src/auth/TokenStore'
import { newPendingSignIn } from '../src/auth/signInState'
import { PendingStore } from '../src/auth/PendingStore'

vi.mock('../src/auth/ProfileSync', () => ({ syncProfile: vi.fn(async () => {}) }))

function fakePlugin() {
  const secrets = new Map<string, string>()
  const settings: any = { signedInEmail: '', serverOrg: { domain: 'old.example', available: true } }
  let handler: (params: Record<string, string>) => Promise<void> = async () => {}
  const plugin: any = {
    settings,
    saveSettings: vi.fn(async () => {}),
    registerObsidianProtocolHandler: (_action: string, h: typeof handler) => { handler = h },
  }
  const secretStorage = { getSecret: (id: string) => secrets.get(id) ?? null, setSecret: (id: string, v: string) => { secrets.set(id, v) } }
  plugin.tokens = new TokenStore(secretStorage, settings, plugin.saveSettings)
  plugin.pending = new PendingStore(secretStorage, settings, plugin.saveSettings)
  registerAuthCallback(plugin)
  return { plugin, call: (p: Record<string, string>) => handler(p) }
}

beforeEach(() => { (Notice as any).messages = [] })

describe('auth callback wiring', () => {
  it('stores the token for the sign-in started on this device and clears the pending state', async () => {
    const { plugin, call } = fakePlugin()
    const p = newPendingSignIn(Date.now())
    await plugin.pending.set([p])
    await call({ action: 'share-hosted/auth-callback', api_token: 's_good', email: 'alice@example.com', state: p.state })
    expect(plugin.tokens.get()).toBe('s_good')
    expect(plugin.settings.signedInEmail).toBe('alice@example.com')
    expect(plugin.pending.get()).toEqual([])
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
    await plugin.pending.set([newPendingSignIn(Date.now())])
    await call({ action: 'share-hosted/auth-callback', api_token: 's_attacker', email: 'mallory@example.net', state: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' })
    expect(plugin.tokens.get()).toBe('')
    expect(plugin.settings.signedInEmail).toBe('')
    expect(plugin.pending.get()).toHaveLength(1)
  })
})
