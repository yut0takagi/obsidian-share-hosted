import { App, Notice, TFile } from 'obsidian'
import { ApiClient } from '../upload/ApiClient'
import { parseShareMeta, removeShareMeta } from '../frontmatter/shareMeta'
import type { ShareHostedSettings } from '../settings/types'

export async function stopSharingCommand(app: App, settings: ShareHostedSettings, file: TFile | null): Promise<void> {
  if (!file) { new Notice('No active note'); return }
  const content = await app.vault.read(file)
  const meta = parseShareMeta(content)
  if (!meta) { new Notice('This note is not shared'); return }
  const notice = new Notice('Stopping…', 0)
  try {
    const api = new ApiClient(settings.workerUrl, settings.apiToken)
    await api.unshare(meta.uuid)
    await app.vault.modify(file, removeShareMeta(content))
    notice.hide()
    new Notice('Stopped sharing')
  } catch (e: any) {
    notice.hide()
    new Notice(`Stop failed: ${e.message}`)
  }
}
