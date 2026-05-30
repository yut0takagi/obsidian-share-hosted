import { requestUrl } from 'obsidian'
import type ShareHostedPlugin from '../../main'

const CALLBACK = 'obsidian://share-hosted/auth-callback'

export async function requestMagicLink(plugin: ShareHostedPlugin, email: string): Promise<void> {
  const res = await requestUrl({
    url: `${plugin.settings.workerUrl}/auth/request-magic-link`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, callback: CALLBACK }),
    throw: false,
  })
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Worker ${res.status}: ${res.text}`)
  }
}
