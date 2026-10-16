import { requestUrl } from 'obsidian'
import type ShareHostedPlugin from '../../main'

export async function syncProfile(plugin: ShareHostedPlugin, patch?: { default_owner_name?: string }): Promise<void> {
  const token = plugin.tokens.get()
  if (!token) return

  if (patch) {
    const res = await requestUrl({
      url: `${plugin.settings.workerUrl}/auth/me`,
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ default_owner_name: patch.default_owner_name ?? null }),
      throw: false,
    })
    if (res.status >= 300) throw new Error(`Profile update failed: ${res.status}`)
  }

  const get = await requestUrl({
    url: `${plugin.settings.workerUrl}/auth/me`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
    throw: false,
  })
  if (get.status >= 300) {
    if (get.status === 401) {
      // Expired or revoked session.
      await plugin.tokens.clear()
      plugin.settings.signedInEmail = ''
      plugin.settings.serverOrg = null
      await plugin.saveSettings()
    }
    return
  }
  const body = JSON.parse(get.text) as {
    user: { email: string; default_owner_name: string | null }
    org?: { domain: string; available: boolean } | null
  }
  plugin.settings.signedInEmail = body.user.email
  plugin.settings.ownerName = body.user.default_owner_name || ''
  plugin.settings.serverOrg = body.org ?? null
  await plugin.saveSettings()
}

async function clearLocalSession(plugin: ShareHostedPlugin): Promise<void> {
  await plugin.tokens.clear()
  plugin.settings.signedInEmail = ''
  plugin.settings.ownerName = ''
  plugin.settings.serverOrg = null
  plugin.settings.pendingSignIn = null
  await plugin.saveSettings()
}

export async function signOut(plugin: ShareHostedPlugin): Promise<void> {
  const token = plugin.tokens.get()
  if (token) {
    try {
      await requestUrl({
        url: `${plugin.settings.workerUrl}/auth/logout`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        throw: false,
      })
    } catch (_) { /* ignore */ }
  }
  await clearLocalSession(plugin)
}

/** Ends every session of the account (e.g. a lost laptop). Needs a 0.2.0 Worker. */
export async function signOutEverywhere(plugin: ShareHostedPlugin): Promise<void> {
  const token = plugin.tokens.get()
  if (!token) return
  const res = await requestUrl({
    url: `${plugin.settings.workerUrl}/auth/logout-all`,
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    throw: false,
  })
  if (res.status === 404) throw new Error('The server does not support this yet.')
  if (res.status >= 300 && res.status !== 401) throw new Error(`Sign-out failed: ${res.status}`)
  await clearLocalSession(plugin)
}
