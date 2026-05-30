import { App, Notice, TFile } from 'obsidian'
import { parseShareMeta } from '../frontmatter/shareMeta'

export async function copyShareUrlCommand(app: App, file: TFile | null): Promise<void> {
  if (!file) { new Notice('No active note'); return }
  const content = await app.vault.read(file)
  const meta = parseShareMeta(content)
  if (!meta) { new Notice('This note is not shared'); return }
  await navigator.clipboard.writeText(meta.url)
  new Notice('Share URL copied')
}
