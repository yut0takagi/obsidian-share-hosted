// Keeps the session token out of data.json, which sits in the vault and often ends up in
// sync services or git. Obsidian 1.11.4+ has SecretStorage (encrypted with the OS keychain,
// not synced between devices); older versions keep the previous data.json behaviour.

export interface SecretStorageLike {
  getSecret(id: string): string | null
  setSecret(id: string, secret: string): void
}

export const TOKEN_SECRET_ID = 'share-hosted-api-token'

/** Feature-detects app.secretStorage so minAppVersion can stay where it is. */
export function getSecretStorage(app: unknown): SecretStorageLike | null {
  const s = (app as { secretStorage?: Partial<SecretStorageLike> } | null)?.secretStorage
  if (s && typeof s.getSecret === 'function' && typeof s.setSecret === 'function') return s as SecretStorageLike
  return null
}

export class TokenStore {
  constructor(
    private secrets: SecretStorageLike | null,
    private settings: { apiToken?: string },
    private save: () => Promise<void>,
  ) {}

  get usesSecretStorage(): boolean {
    return this.secrets !== null
  }

  get(): string {
    // A token still in data.json (the move failed) counts, rather than looking signed out.
    const secret = this.secrets ? this.secrets.getSecret(TOKEN_SECRET_ID) : null
    return secret || this.settings.apiToken || ''
  }

  async set(token: string): Promise<void> {
    if (this.secrets) {
      this.secrets.setSecret(TOKEN_SECRET_ID, token)
      if ('apiToken' in this.settings) {
        delete this.settings.apiToken
        await this.save()
      }
      return
    }
    this.settings.apiToken = token
    await this.save()
  }

  async clear(): Promise<void> {
    if (this.secrets) {
      // SecretStorage has no delete; an empty value means "signed out".
      try { this.secrets.setSecret(TOKEN_SECRET_ID, '') } catch (e) { console.error('[share-hosted] could not clear SecretStorage', e) }
    }
    if (!('apiToken' in this.settings)) return
    delete this.settings.apiToken
    await this.save()
  }

  /** Moves a token saved by 0.1.0 out of data.json. True when something moved. */
  async migrate(): Promise<boolean> {
    const legacy = this.settings.apiToken
    if (!this.secrets || !legacy) return false
    try {
      this.secrets.setSecret(TOKEN_SECRET_ID, legacy)
      if (this.secrets.getSecret(TOKEN_SECRET_ID) !== legacy) return false
    } catch (e) {
      console.error('[share-hosted] could not move the session token to SecretStorage; keeping it in data.json', e)
      return false
    }
    delete this.settings.apiToken
    await this.save()
    return true
  }
}
