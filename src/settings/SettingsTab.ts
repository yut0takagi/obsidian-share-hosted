import { App, PluginSettingTab, Setting, Notice } from 'obsidian'
import type ShareHostedPlugin from '../../main'
import { requestMagicLink } from '../auth/SignInFlow'
import { syncProfile, signOut } from '../auth/ProfileSync'

export class ShareHostedSettingsTab extends PluginSettingTab {
  plugin: ShareHostedPlugin
  constructor(app: App, plugin: ShareHostedPlugin) { super(app, plugin); this.plugin = plugin }

  display(): void {
    const { containerEl } = this
    containerEl.empty()
    containerEl.createEl('h2', { text: 'Share Hosted' })

    if (this.plugin.settings.apiToken && this.plugin.settings.signedInEmail) {
      this.renderSignedIn(containerEl)
    } else {
      this.renderSignedOut(containerEl)
    }
  }

  private renderSignedIn(c: HTMLElement) {
    const status = c.createDiv({ cls: 'share-hosted-signin-status' })
    status.setText(`Signed in as ${this.plugin.settings.signedInEmail}`)

    new Setting(c).setName('Account')
      .addButton((b) => b.setButtonText('Sign out').onClick(async () => {
        await signOut(this.plugin)
        new Notice('Signed out')
        this.display()
      }))
      .addButton((b) => b.setButtonText('Refresh profile').onClick(async () => {
        await syncProfile(this.plugin)
        new Notice('Profile refreshed')
        this.display()
      }))

    new Setting(c).setName('Display name').setDesc('Shown as "Shared by X"').addText((t) =>
      t.setValue(this.plugin.settings.ownerName).onChange(async (v) => {
        this.plugin.settings.ownerName = v
        await this.plugin.saveSettings()
        try { await syncProfile(this.plugin, { default_owner_name: v, default_org_domain: this.plugin.settings.orgDomain }) } catch (_) {}
      }),
    )

    new Setting(c).setName('Org domain').setDesc('Used by "Org-wide" mode').addText((t) =>
      t.setValue(this.plugin.settings.orgDomain).onChange(async (v) => {
        this.plugin.settings.orgDomain = v
        await this.plugin.saveSettings()
        try { await syncProfile(this.plugin, { default_owner_name: this.plugin.settings.ownerName, default_org_domain: v }) } catch (_) {}
      }),
    )

    new Setting(c).setName('Default expiry').addDropdown((d) =>
      d.addOption('1d', '1 day').addOption('7d', '7 days').addOption('30d', '30 days').addOption('never', 'Never')
        .setValue(this.plugin.settings.defaultExpiry)
        .onChange(async (v) => { this.plugin.settings.defaultExpiry = v as any; await this.plugin.saveSettings() }),
    )

    new Setting(c).setName('Default mode').addDropdown((d) =>
      d.addOption('org', 'Org-wide').addOption('list', 'Specific people').addOption('public', 'Public link')
        .setValue(this.plugin.settings.defaultMode)
        .onChange(async (v) => { this.plugin.settings.defaultMode = v as any; await this.plugin.saveSettings() }),
    )
  }

  private renderSignedOut(c: HTMLElement) {
    let email = ''
    new Setting(c).setName('Email').setDesc('We will send you a magic link.').addText((t) =>
      t.setPlaceholder('you@example.com').onChange((v) => { email = v.trim() }),
    )
    new Setting(c).addButton((b) =>
      b.setButtonText('Send magic link').setCta().onClick(async () => {
        if (!email) { new Notice('Please enter your email'); return }
        try {
          await requestMagicLink(this.plugin, email)
          new Notice(`Magic link sent to ${email}. Check your inbox.`)
        } catch (e: any) {
          new Notice(`Failed: ${e.message}`)
        }
      }),
    )
  }
}
