import { Notice, TFile } from 'obsidian'
import type ShareHostedPlugin from '../../main'
import { ApiClient } from '../upload/ApiClient'
import { parseShareMeta, removeShareMeta } from '../frontmatter/shareMeta'

export async function stopSharingCommand(plugin: ShareHostedPlugin, file: TFile | null): Promise<void> {
  if (!file) { new Notice('No active note'); return }
  const content = await plugin.app.vault.read(file)
  const meta = parseShareMeta(content)
  if (!meta) { new Notice('This note is not shared'); return }
  const notice = new Notice('Stopping…', 0)
  try {
    const api = new ApiClient(plugin.settings.workerUrl, plugin.tokens.get())
    await api.unshare(meta.uuid)
    await plugin.app.vault.modify(file, removeShareMeta(content))
    notice.hide()
    new Notice('Stopped sharing')
  } catch (e: any) {
    notice.hide()
    new Notice(`Stop failed: ${e.message}`)
  }
}
