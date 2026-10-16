import { describe, it, expect, vi } from 'vitest'
import { TokenStore, getSecretStorage, TOKEN_SECRET_ID, type SecretStorageLike } from '../src/auth/TokenStore'

class FakeSecrets implements SecretStorageLike {
  values = new Map<string, string>()
  getSecret(id: string) { return this.values.get(id) ?? null }
  setSecret(id: string, secret: string) { this.values.set(id, secret) }
}

describe('getSecretStorage', () => {
  it('returns app.secretStorage when the API is there', () => {
    const secrets = new FakeSecrets()
    expect(getSecretStorage({ secretStorage: secrets })).toBe(secrets)
  })

  it('returns null on Obsidian versions without it', () => {
    expect(getSecretStorage({})).toBeNull()
    expect(getSecretStorage({ secretStorage: { getSecret: 1 } })).toBeNull()
  })
})

describe('TokenStore with SecretStorage', () => {
  it('moves a token found in data.json into SecretStorage and removes it from data.json', async () => {
    const secrets = new FakeSecrets()
    const settings: { apiToken?: string } = { apiToken: 's_legacy' }
    const save = vi.fn(async () => {})
    const store = new TokenStore(secrets, settings, save)

    expect(await store.migrate()).toBe(true)
    expect(secrets.getSecret(TOKEN_SECRET_ID)).toBe('s_legacy')
    expect('apiToken' in settings).toBe(false)
    expect(save).toHaveBeenCalled()
    expect(store.get()).toBe('s_legacy')
  })

  it('does nothing when data.json holds no token', async () => {
    const settings: { apiToken?: string } = {}
    const save = vi.fn(async () => {})
    expect(await new TokenStore(new FakeSecrets(), settings, save).migrate()).toBe(false)
    expect(save).not.toHaveBeenCalled()
  })

  it('keeps the token in data.json if SecretStorage refuses it', async () => {
    const secrets = new FakeSecrets()
    secrets.setSecret = () => { throw new Error('locked') }
    const settings: { apiToken?: string } = { apiToken: 's_legacy' }
    const store = new TokenStore(secrets, settings, async () => {})
    expect(await store.migrate()).toBe(false)
    expect(settings.apiToken).toBe('s_legacy')
  })

  it('still uses the data.json token when the move failed, instead of looking signed out', async () => {
    const secrets = new FakeSecrets()
    secrets.setSecret = () => { throw new Error('locked') }
    const store = new TokenStore(secrets, { apiToken: 's_legacy' }, async () => {})
    await store.migrate()
    expect(store.get()).toBe('s_legacy')
  })

  it('prefers SecretStorage when both hold a token', () => {
    const secrets = new FakeSecrets()
    secrets.setSecret(TOKEN_SECRET_ID, 's_secret')
    expect(new TokenStore(secrets, { apiToken: 's_legacy' }, async () => {}).get()).toBe('s_secret')
  })

  it('clears both places on sign-out', async () => {
    const secrets = new FakeSecrets()
    secrets.setSecret = () => { throw new Error('locked') }
    const settings: { apiToken?: string } = { apiToken: 's_legacy' }
    const store = new TokenStore(secrets, settings, async () => {})
    await store.clear().catch(() => {})
    expect(store.get()).toBe('')
  })

  it('writes new tokens only to SecretStorage', async () => {
    const secrets = new FakeSecrets()
    const settings: { apiToken?: string } = {}
    const store = new TokenStore(secrets, settings, async () => {})
    await store.set('s_new')
    expect(secrets.getSecret(TOKEN_SECRET_ID)).toBe('s_new')
    expect(settings.apiToken).toBeUndefined()
  })

  it('clears the stored token', async () => {
    const secrets = new FakeSecrets()
    const store = new TokenStore(secrets, {}, async () => {})
    await store.set('s_new')
    await store.clear()
    expect(store.get()).toBe('')
  })
})

describe('TokenStore without SecretStorage', () => {
  it('falls back to data.json as before', async () => {
    const settings: { apiToken?: string } = {}
    const save = vi.fn(async () => {})
    const store = new TokenStore(null, settings, save)
    expect(await store.migrate()).toBe(false)
    await store.set('s_plain')
    expect(settings.apiToken).toBe('s_plain')
    expect(store.get()).toBe('s_plain')
    await store.clear()
    expect(store.get()).toBe('')
    expect(store.usesSecretStorage).toBe(false)
  })
})
