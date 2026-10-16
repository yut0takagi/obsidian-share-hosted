import { Plugin, MarkdownView } from 'obsidian'
import { DEFAULT_SETTINGS } from './src/settings/defaults'
import type { ShareHostedSettings } from './src/settings/types'
import { ShareHostedSettingsTab } from './src/settings/SettingsTab'
import { registerAuthCallback } from './src/auth/ProtocolHandler'
import { TokenStore, getSecretStorage } from './src/auth/TokenStore'
import { PendingStore } from './src/auth/PendingStore'
import { shareNoteCommand } from './src/commands/shareNote'
import { copyShareUrlCommand } from './src/commands/copyShareUrl'
import { stopSharingCommand } from './src/commands/stopSharing'

export default class ShareHostedPlugin extends Plugin {
  settings!: ShareHostedSettings
  tokens!: TokenStore
  pending!: PendingStore
  async onload() {
    await this.loadSettings()
    const secrets = getSecretStorage(this.app)
    this.tokens = new TokenStore(secrets, this.settings, () => this.saveSettings())
    this.pending = new PendingStore(secrets, this.settings, () => this.saveSettings())
    if (await this.tokens.migrate()) console.log('[share-hosted] moved the session token from data.json to SecretStorage')
    this.addSettingTab(new ShareHostedSettingsTab(this.app, this))
    registerAuthCallback(this)

    const activeFile = () => this.app.workspace.getActiveViewOfType(MarkdownView)?.file ?? null

    this.addCommand({ id: 'share-this-note', name: 'Share this note',
      checkCallback: (checking) => { const f = activeFile(); if (!f) return false; if (checking) return true; shareNoteCommand(this, f); return true } })
    this.addCommand({ id: 'copy-share-url', name: 'Copy share URL',
      checkCallback: (checking) => { const f = activeFile(); if (!f) return false; if (checking) return true; copyShareUrlCommand(this.app, f); return true } })
    this.addCommand({ id: 'stop-sharing', name: 'Stop sharing',
      checkCallback: (checking) => { const f = activeFile(); if (!f) return false; if (checking) return true; stopSharingCommand(this, f); return true } })

    this.addRibbonIcon('share', 'Share this note', () => { shareNoteCommand(this, activeFile()) })

    console.log('[share-hosted] loaded')
  }
  async onunload() { console.log('[share-hosted] unloaded') }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
    // 0.1.0 kept a free-text org domain; org-wide sharing now follows the sign-in email.
    delete (this.settings as unknown as Record<string, unknown>).orgDomain
  }
  async saveSettings() { await this.saveData(this.settings) }
}
