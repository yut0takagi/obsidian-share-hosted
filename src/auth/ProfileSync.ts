import { requestUrl } from 'obsidian'
import type ShareHostedPlugin from '../../main'

export async function syncProfile(plugin: ShareHostedPlugin, patch?: { default_owner_name?: string; default_org_domain?: string }): Promise<void> {
  if (!plugin.settings.apiToken) return

  if (patch) {
    const res = await requestUrl({
      url: `${plugin.settings.workerUrl}/auth/me`,
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${plugin.settings.apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        default_owner_name: patch.default_owner_name ?? null,
        default_org_domain: patch.default_org_domain ?? null,
      }),
      throw: false,
    })
    if (res.status >= 300) throw new Error(`Profile update failed: ${res.status}`)
  }

  const get = await requestUrl({
    url: `${plugin.settings.workerUrl}/auth/me`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${plugin.settings.apiToken}` },
    throw: false,
  })
  if (get.status >= 300) {
    if (get.status === 401) {
      plugin.settings.apiToken = ''
      plugin.settings.signedInEmail = ''
      await plugin.saveSettings()
    }
    return
  }
  const body = JSON.parse(get.text) as { user: { email: string; default_org_domain: string | null; default_owner_name: string | null } }
  plugin.settings.signedInEmail = body.user.email
  plugin.settings.ownerName = body.user.default_owner_name || ''
  plugin.settings.orgDomain = body.user.default_org_domain || ''
  await plugin.saveSettings()
}

export async function signOut(plugin: ShareHostedPlugin): Promise<void> {
  if (plugin.settings.apiToken) {
    try {
      await requestUrl({
        url: `${plugin.settings.workerUrl}/auth/logout`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${plugin.settings.apiToken}` },
        throw: false,
      })
    } catch (_) { /* ignore */ }
  }
  plugin.settings.apiToken = ''
  plugin.settings.signedInEmail = ''
  plugin.settings.ownerName = ''
  plugin.settings.orgDomain = ''
  await plugin.saveSettings()
}
