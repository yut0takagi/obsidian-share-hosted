import { App, Modal, Setting, Notice } from 'obsidian'
import type { ShareMeta } from '../frontmatter/shareMeta'

export interface SharedStatusActions {
  onUpdate: () => void
  onStop: () => void
}

export class SharedStatusModal extends Modal {
  constructor(app: App, private meta: ShareMeta, private actions: SharedStatusActions) {
    super(app)
  }

  onOpen() {
    const { contentEl } = this
    contentEl.empty()
    contentEl.createEl('h2', { text: 'This note is shared' })

    const urlRow = contentEl.createDiv({ cls: 'share-hosted-url-row' })
    urlRow.createEl('span', { text: 'URL: ' })
    const urlEl = urlRow.createEl('a', { text: this.meta.url, href: this.meta.url })
    urlEl.setAttribute('target', '_blank')
    const copyBtn = urlRow.createEl('button', { text: 'Copy' })
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(this.meta.url)
      new Notice('URL copied')
    })

    new Setting(contentEl)
      .setName('Mode')
      .setDesc(this.meta.mode === 'org' ? 'Org-wide' : this.meta.mode === 'list' ? 'Specific people' : 'Public link')

    const buttons = contentEl.createDiv({ cls: 'share-hosted-modal-buttons' })
    buttons.createEl('button', { text: 'Stop sharing', cls: 'mod-warning' }).addEventListener('click', () => {
      this.actions.onStop()
      this.close()
    })
    buttons.createEl('button', { text: 'Update settings', cls: 'mod-cta' }).addEventListener('click', () => {
      this.actions.onUpdate()
      this.close()
    })
  }
}
