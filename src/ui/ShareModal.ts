import { App, Modal, Notice, Setting } from 'obsidian'
import type { ExpiryOption } from '../util/expiry'

export interface ShareModalResult {
  mode: 'org' | 'list' | 'public'
  audience: string[]
  expiry: ExpiryOption
}

export interface ShareModalDefaults {
  mode: 'org' | 'list' | 'public'
  expiry: ExpiryOption
  orgDomain: string
}

export class ShareModal extends Modal {
  private resolver!: (value: ShareModalResult | null) => void
  private done = false
  private mode: 'org' | 'list' | 'public'
  private audienceText = ''
  private expiry: ExpiryOption

  constructor(app: App, private defaults: ShareModalDefaults) {
    super(app)
    this.mode = defaults.mode
    this.expiry = defaults.expiry
  }

  open(): Promise<ShareModalResult | null> {
    return new Promise((resolve) => {
      this.resolver = resolve
      super.open()
    })
  }

  onClose() {
    if (!this.done) {
      this.resolver(null)
      this.done = true
    }
  }

  onOpen() {
    const { contentEl } = this
    contentEl.empty()
    contentEl.createEl('h2', { text: 'Share this note' })

    const audienceContainer = contentEl.createDiv()

    const renderAudienceInput = () => {
      audienceContainer.empty()
      if (this.mode !== 'list') return
      new Setting(audienceContainer)
        .setName('Allowed emails (one per line)')
        .addTextArea((ta) => {
          ta.setValue(this.audienceText).onChange((v) => (this.audienceText = v))
          ta.inputEl.rows = 4
          ta.inputEl.style.width = '100%'
        })
    }

    new Setting(contentEl)
      .setName('Who can see it?')
      .addDropdown((d) =>
        d
          .addOption('org', `Anyone in @${this.defaults.orgDomain}`)
          .addOption('list', 'Specific people')
          .addOption('public', 'Anyone with the link')
          .setValue(this.mode)
          .onChange((v) => {
            this.mode = v as 'org' | 'list' | 'public'
            renderAudienceInput()
          }),
      )

    renderAudienceInput()

    new Setting(contentEl)
      .setName('Expires')
      .addDropdown((d) =>
        d
          .addOption('1d', '1 day')
          .addOption('7d', '7 days')
          .addOption('30d', '30 days')
          .addOption('never', 'Never')
          .setValue(this.expiry)
          .onChange((v) => (this.expiry = v as ExpiryOption)),
      )

    const buttons = contentEl.createDiv({ cls: 'share-hosted-modal-buttons' })
    buttons.createEl('button', { text: 'Cancel' }).addEventListener('click', () => {
      this.resolver(null)
      this.done = true
      this.close()
    })
    const shareBtn = buttons.createEl('button', { text: 'Share', cls: 'mod-cta' })
    shareBtn.addEventListener('click', () => {
      const audience = this.audienceText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
      if (this.mode === 'list' && audience.length === 0) {
        new Notice('Please add at least one email')
        return
      }
      this.resolver({ mode: this.mode, audience, expiry: this.expiry })
      this.done = true
      this.close()
    })
  }
}
