// Ties a sign-in callback to a sign-in this device started. Without it, anyone could send a
// crafted obsidian://share-hosted/auth-callback link and sign the plugin into their account,
// so notes shared afterwards would land with them.

export interface PendingSignIn {
  state: string
  createdAt: number
}

// The emailed link lives 15 minutes; allow a little more for slow mail.
export const PENDING_SIGN_IN_TTL_MS = 20 * 60 * 1000

export const AUTH_CALLBACK = 'obsidian://share-hosted/auth-callback'

function base64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function newPendingSignIn(now: number): PendingSignIn {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return { state: base64url(bytes), createdAt: now }
}

/** The state also rides on the callback URL, which 0.1.0 Workers pass back unchanged. */
export function callbackUrlFor(state: string): string {
  return `${AUTH_CALLBACK}?state=${encodeURIComponent(state)}`
}

function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export type StateCheck = 'ok' | 'not_started' | 'mismatch' | 'expired'

export function checkCallbackState(pending: PendingSignIn | null, received: string | undefined, now: number): StateCheck {
  if (!pending || !pending.state) return 'not_started'
  if (!received || !sameString(pending.state, received)) return 'mismatch'
  if (now - pending.createdAt > PENDING_SIGN_IN_TTL_MS) return 'expired'
  return 'ok'
}
