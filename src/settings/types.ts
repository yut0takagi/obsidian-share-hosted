import type { PendingSignIn } from '../auth/signInState'

export interface ShareHostedSettings {
  workerUrl: string
  /** Session token, only where Obsidian lacks SecretStorage (before 1.11.4). See TokenStore. */
  apiToken?: string
  signedInEmail: string
  ownerName: string
  /** Org-wide audience as reported by the Worker's /auth/me; null with a 0.1.0 Worker. */
  serverOrg: { domain: string; available: boolean } | null
  /** A sign-in started on this device that has not come back yet. */
  pendingSignIn: PendingSignIn | null
  defaultExpiry: '1d' | '7d' | '30d' | 'never'
  defaultMode: 'org' | 'list' | 'public'
}
