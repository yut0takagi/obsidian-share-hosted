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
