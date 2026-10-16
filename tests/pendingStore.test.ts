import { describe, it, expect, vi } from 'vitest'
import { PendingStore, PENDING_SECRET_ID } from '../src/auth/PendingStore'

class FakeSecrets {
  values = new Map<string, string>()
  getSecret(id: string) { return this.values.get(id) ?? null }
  setSecret(id: string, v: string) { this.values.set(id, v) }
}

const P = { state: 'abcdefghijklmnopqrstuvwxyz012345', createdAt: 1 }

describe('PendingStore', () => {
  it('keeps pending sign-ins in SecretStorage when it exists, not in data.json', async () => {
    const secrets = new FakeSecrets()
    const settings: { pendingSignIns?: { state: string; createdAt: number }[] } = {}
    const save = vi.fn(async () => {})
    const store = new PendingStore(secrets, settings, save)
    await store.set([P])
    expect(JSON.parse(secrets.getSecret(PENDING_SECRET_ID)!)).toEqual([P])
    expect(settings.pendingSignIns).toBeUndefined()
    expect(store.get()).toEqual([P])
  })

  it('falls back to data.json without SecretStorage', async () => {
    const settings: { pendingSignIns?: { state: string; createdAt: number }[] } = {}
    const store = new PendingStore(null, settings, async () => {})
    await store.set([P])
    expect(settings.pendingSignIns).toEqual([P])
    expect(store.get()).toEqual([P])
  })

  it('reads garbage as nothing pending', () => {
    const secrets = new FakeSecrets()
    secrets.setSecret(PENDING_SECRET_ID, 'not json')
    expect(new PendingStore(secrets, {}, async () => {}).get()).toEqual([])
  })

  it('clears', async () => {
    const secrets = new FakeSecrets()
    const store = new PendingStore(secrets, {}, async () => {})
    await store.set([P])
    await store.clear()
    expect(store.get()).toEqual([])
  })
})
