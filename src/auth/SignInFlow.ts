import { requestUrl } from 'obsidian'
import type ShareHostedPlugin from '../../main'
import { newPendingSignIn, rememberPending } from './signInState'
import { magicLinkRequestBody } from './callback'

export async function requestMagicLink(plugin: ShareHostedPlugin, email: string): Promise<void> {
  const pending = newPendingSignIn(Date.now())
  const res = await requestUrl({
    url: `${plugin.settings.workerUrl}/auth/request-magic-link`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(magicLinkRequestBody(email, pending)),
    throw: false,
  })
  if (res.status < 200 || res.status >= 300) {
    // Nothing was sent, so earlier links stay the ones that can sign in.
    let message = res.text
    try { message = (JSON.parse(res.text) as { message?: string; error?: string }).message || message } catch { /* plain text */ }
    throw new Error(res.status === 429 || res.status === 503 ? message : `Worker ${res.status}: ${message}`)
  }
  // Remembered so the callback can prove it answers a request from this device.
  await plugin.pending.set(rememberPending(plugin.pending.get(), pending, Date.now()))
}

/** Trades the one-time code from the callback (0.2.0 Worker) for the session token. */
export async function exchangeCode(plugin: ShareHostedPlugin, code: string, state: string): Promise<{ token: string; email: string }> {
  const res = await requestUrl({
    url: `${plugin.settings.workerUrl}/auth/exchange`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state }),
    throw: false,
  })
  if (res.status !== 200) {
    let message = `Sign-in failed (${res.status}). Send a new link from Settings → Share Hosted.`
    try { message = (JSON.parse(res.text) as { message?: string }).message || message } catch { /* plain text */ }
    throw new Error(message)
  }
  const body = JSON.parse(res.text) as { api_token: string; email: string }
  return { token: body.api_token, email: body.email }
}
