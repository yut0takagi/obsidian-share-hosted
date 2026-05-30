import { Plugin, MarkdownView } from 'obsidian'
import { DEFAULT_SETTINGS } from './src/settings/defaults'
import type { ShareHostedSettings } from './src/settings/types'
import { ShareHostedSettingsTab } from './src/settings/SettingsTab'
import { registerAuthCallback } from './src/auth/ProtocolHandler'
import { shareNoteCommand } from './src/commands/shareNote'
import { copyShareUrlCommand } from './src/commands/copyShareUrl'
import { stopSharingCommand } from './src/commands/stopSharing'

export default class ShareHostedPlugin extends Plugin {
  settings!: ShareHostedSettings
  async onload() {
    await this.loadSettings()
    this.addSettingTab(new ShareHostedSettingsTab(this.app, this))
    registerAuthCallback(this)

    const activeFile = () => this.app.workspace.getActiveViewOfType(MarkdownView)?.file ?? null

    this.addCommand({ id: 'share-this-note', name: 'Share this note',
      checkCallback: (checking) => { const f = activeFile(); if (!f) return false; if (checking) return true; shareNoteCommand(this.app, this.settings, f); return true } })
    this.addCommand({ id: 'copy-share-url', name: 'Copy share URL',
      checkCallback: (checking) => { const f = activeFile(); if (!f) return false; if (checking) return true; copyShareUrlCommand(this.app, f); return true } })
    this.addCommand({ id: 'stop-sharing', name: 'Stop sharing',
      checkCallback: (checking) => { const f = activeFile(); if (!f) return false; if (checking) return true; stopSharingCommand(this.app, this.settings, f); return true } })

    this.addRibbonIcon('share', 'Share this note', () => { shareNoteCommand(this.app, this.settings, activeFile()) })

    console.log('[share-hosted] loaded')
  }
  async onunload() { console.log('[share-hosted] unloaded') }
  async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) }
  async saveSettings() { await this.saveData(this.settings) }
}
