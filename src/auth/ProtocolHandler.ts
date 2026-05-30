import { Notice } from 'obsidian'
import type ShareHostedPlugin from '../../main'
import { syncProfile } from './ProfileSync'

export function registerAuthCallback(plugin: ShareHostedPlugin): void {
  plugin.registerObsidianProtocolHandler('share-hosted/auth-callback', async (params) => {
    const apiToken = params.api_token
    const email = params.email
    if (!apiToken || !email) {
      new Notice('Sign in failed: missing token or email')
      return
    }
    plugin.settings.apiToken = apiToken
    plugin.settings.signedInEmail = email
    await plugin.saveSettings()
    new Notice(`Signed in as ${email}`)
    try {
      await syncProfile(plugin)
    } catch (e) {
      console.error('[share-hosted] profile sync failed:', e)
    }
  })
}
