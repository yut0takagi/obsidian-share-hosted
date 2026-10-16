import type { PendingSignIn } from './signInState'
import type { SecretStorageLike } from './TokenStore'

// The states of sign-ins in flight. They decide which callback may sign the plugin in, so
// they live next to the token: in SecretStorage when Obsidian has it, else in data.json.
export const PENDING_SECRET_ID = 'share-hosted-pending-sign-in'

function parse(value: unknown): PendingSignIn[] {
  if (!Array.isArray(value)) return []
  return value.filter((p): p is PendingSignIn => !!p && typeof p.state === 'string' && typeof p.createdAt === 'number')
}

export class PendingStore {
  constructor(
    private secrets: SecretStorageLike | null,
    private settings: { pendingSignIns?: PendingSignIn[] },
    private save: () => Promise<void>,
  ) {}

  get(): PendingSignIn[] {
    if (this.secrets) {
      try { return parse(JSON.parse(this.secrets.getSecret(PENDING_SECRET_ID) || '[]')) } catch { return [] }
    }
    return parse(this.settings.pendingSignIns)
  }

  async set(list: PendingSignIn[]): Promise<void> {
    if (this.secrets) {
      this.secrets.setSecret(PENDING_SECRET_ID, JSON.stringify(list))
      return
    }
    this.settings.pendingSignIns = list
    await this.save()
  }

  async clear(): Promise<void> {
    await this.set([])
  }
}
