import { callbackUrlFor, checkCallbackState, type PendingSignIn } from './signInState'

export type CallbackResult =
  /** 0.2.0 Worker: a one-time code to trade for the token at /auth/exchange. */
  | { ok: true; kind: 'code'; code: string; state: string }
  /** 0.1.0 Worker: the token itself is on the callback. */
  | { ok: true; kind: 'token'; token: string; email: string }
  | { ok: false; message: string }

/** Decides whether an obsidian://share-hosted/auth-callback may sign this plugin in. */
export function evaluateAuthCallback(params: Record<string, string | undefined>, pending: PendingSignIn[], now: number): CallbackResult {
  const { code, api_token: token, email } = params
  if (!code && (!token || !email)) return { ok: false, message: 'Sign-in failed: the link was incomplete.' }

  switch (checkCallbackState(pending, params.state, now)) {
    case 'ok':
      return code ? { ok: true, kind: 'code', code, state: params.state! } : { ok: true, kind: 'token', token: token!, email: email! }
    case 'not_started':
      return { ok: false, message: 'Ignored a sign-in link that was not requested from this device. To sign in, open Settings → Share Hosted and send a new link.' }
    case 'expired':
      return { ok: false, message: 'This sign-in link is too old. Send a new one from Settings → Share Hosted.' }
    case 'mismatch':
      return { ok: false, message: 'This sign-in link does not match the latest request from this device. Use the newest email, or send a new link.' }
  }
}

export function magicLinkRequestBody(email: string, pending: PendingSignIn): { email: string; callback: string; state: string } {
  return { email, callback: callbackUrlFor(pending.state), state: pending.state }
}
