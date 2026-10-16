import { App, PluginSettingTab, Setting, Notice } from 'obsidian'
import type ShareHostedPlugin from '../../main'
import { requestMagicLink } from '../auth/SignInFlow'
import { syncProfile, signOut, signOutEverywhere } from '../auth/ProfileSync'
import { orgTarget } from './orgDomain'

export class ShareHostedSettingsTab extends PluginSettingTab {
  plugin: ShareHostedPlugin
  constructor(app: App, plugin: ShareHostedPlugin) { super(app, plugin); this.plugin = plugin }

  display(): void {
    const { containerEl } = this
    containerEl.empty()
    containerEl.createEl('h2', { text: 'Share Hosted' })

    if (this.plugin.tokens.get() && this.plugin.settings.signedInEmail) {
      this.renderSignedIn(containerEl)
    } else {
      this.renderSignedOut(containerEl)
    }
  }

  private renderSignedIn(c: HTMLElement) {
    const status = c.createDiv({ cls: 'share-hosted-signin-status' })
    status.setText(`Signed in as ${this.plugin.settings.signedInEmail}`)
    if (!this.plugin.tokens.usesSecretStorage) {
      c.createDiv({
        cls: 'share-hosted-signin-status',
        text: 'This Obsidian version has no secret storage, so the session is kept in the plugin data file. Update Obsidian to 1.11.4 or later to keep it out of your vault.',
      })
    }

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

    new Setting(c).setName('Sign out on all devices')
      .setDesc('Ends every session of this account, for example after losing a device.')
      .addButton((b) => b.setButtonText('Sign out everywhere').setWarning().onClick(async () => {
        try {
          await signOutEverywhere(this.plugin)
          new Notice('Signed out on all devices')
        } catch (e: any) {
          new Notice(`Failed: ${e.message}`)
        }
        this.display()
      }))

    new Setting(c).setName('Display name').setDesc('Shown as "Shared by X"').addText((t) =>
      t.setValue(this.plugin.settings.ownerName).onChange(async (v) => {
        this.plugin.settings.ownerName = v
        await this.plugin.saveSettings()
        try { await syncProfile(this.plugin, { default_owner_name: v }) } catch (_) {}
      }),
    )

    const org = orgTarget(this.plugin.settings.signedInEmail, this.plugin.settings.serverOrg)
    new Setting(c).setName('Org-wide sharing')
      .setDesc(org.available ? `${org.label}: the domain you signed in with.` : org.reason)

    new Setting(c).setName('Default expiry').addDropdown((d) =>
      d.addOption('1d', '1 day').addOption('7d', '7 days').addOption('30d', '30 days').addOption('never', 'Never')
        .setValue(this.plugin.settings.defaultExpiry)
        .onChange(async (v) => { this.plugin.settings.defaultExpiry = v as any; await this.plugin.saveSettings() }),
    )

    new Setting(c).setName('Default mode')
      .setDesc(org.available ? '' : 'Org-wide is not available for your address, so new shares start with specific people.')
      .addDropdown((d) => {
        if (org.available) d.addOption('org', `Org-wide (@${org.domain})`)
        d.addOption('list', 'Specific people').addOption('public', 'Public link')
          .setValue(this.plugin.settings.defaultMode === 'org' && !org.available ? 'list' : this.plugin.settings.defaultMode)
          .onChange(async (v) => { this.plugin.settings.defaultMode = v as any; await this.plugin.saveSettings() })
      })
  }

  private renderSignedOut(c: HTMLElement) {
    let email = ''
    new Setting(c).setName('Email').setDesc('We will send you a sign-in link. Open it on this device.').addText((t) =>
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
