import { Notice } from 'obsidian'
import type ShareHostedPlugin from '../../main'
import { syncProfile } from './ProfileSync'
import { evaluateAuthCallback } from './callback'

export function registerAuthCallback(plugin: ShareHostedPlugin): void {
  plugin.registerObsidianProtocolHandler('share-hosted/auth-callback', async (params) => {
    const result = evaluateAuthCallback(params, plugin.settings.pendingSignIn, Date.now())
    if (!result.ok) {
      // The token is not stored: only the sign-in started from this device may complete.
      new Notice(result.message, 10000)
      return
    }
    plugin.settings.pendingSignIn = null
    plugin.settings.signedInEmail = result.email
    plugin.settings.serverOrg = null
    await plugin.saveSettings()
    await plugin.tokens.set(result.token)
    new Notice(`Signed in as ${result.email}`)
    try {
      await syncProfile(plugin)
    } catch (e) {
      console.error('[share-hosted] profile sync failed:', e)
    }
  })
}
