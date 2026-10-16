import { Notice } from 'obsidian'
import type ShareHostedPlugin from '../../main'
import { syncProfile } from './ProfileSync'
import { evaluateAuthCallback } from './callback'
import { exchangeCode } from './SignInFlow'

export function registerAuthCallback(plugin: ShareHostedPlugin): void {
  plugin.registerObsidianProtocolHandler('share-hosted/auth-callback', async (params) => {
    const result = evaluateAuthCallback(params, plugin.pending.get(), Date.now())
    if (!result.ok) {
      // The token is not stored: only a sign-in started from this device may complete.
      new Notice(result.message, 10000)
      return
    }

    let token: string
    let email: string
    if (result.kind === 'code') {
      try {
        ({ token, email } = await exchangeCode(plugin, result.code, result.state))
      } catch (e: any) {
        new Notice(e.message, 10000)
        return
      }
    } else {
      ({ token, email } = result)
    }

    await plugin.pending.clear()
    plugin.settings.signedInEmail = email
    plugin.settings.serverOrg = null
    await plugin.saveSettings()
    await plugin.tokens.set(token)
    new Notice(`Signed in as ${email}`)
    try {
      await syncProfile(plugin)
    } catch (e) {
      console.error('[share-hosted] profile sync failed:', e)
    }
  })
}
