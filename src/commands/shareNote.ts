import { App, Notice, TFile } from 'obsidian'
import { ApiClient } from '../upload/ApiClient'
import { ImageUploader } from '../upload/ImageUploader'
import { markdownToHtml } from '../render/markdownToHtml'
import { renderFullHtml } from '../render/template'
import { expiryToIso } from '../util/expiry'
import { parseShareMeta, applyShareMeta, removeShareMeta, type ShareMeta } from '../frontmatter/shareMeta'
import { ShareModal } from '../ui/ShareModal'
import { SharedStatusModal } from '../ui/SharedStatusModal'
import type { ShareHostedSettings } from '../settings/types'

export async function shareNoteCommand(app: App, settings: ShareHostedSettings, file: TFile | null): Promise<void> {
  if (!file) { new Notice('No active note'); return }
  if (!settings.apiToken) { new Notice('Sign in first in plugin settings'); return }

  const content = await app.vault.read(file)
  const existing = parseShareMeta(content)

  if (existing) {
    new SharedStatusModal(app, existing, {
      onUpdate: () => runShareFlow(app, settings, file, existing),
      onStop: () => stopSharing(app, settings, file, existing),
    }).open()
    return
  }
  await runShareFlow(app, settings, file, null)
}

async function runShareFlow(app: App, settings: ShareHostedSettings, file: TFile, existing: ShareMeta | null): Promise<void> {
  const modal = new ShareModal(app, {
    mode: existing?.mode || settings.defaultMode,
    expiry: settings.defaultExpiry,
    orgDomain: settings.orgDomain,
  })
  const result = await modal.open()
  if (!result) return

  const notice = new Notice('Sharing…', 0)
  try {
    const api = new ApiClient(settings.workerUrl, settings.apiToken)
    const uploader = new ImageUploader(app, api)

    const raw = await app.vault.read(file)
    const bodyHtml = markdownToHtml(raw)
    const { map: imgMap, skipped } = await uploader.uploadImagesIn(bodyHtml, file.path)
    const bodyWithImages = ImageUploader.rewriteImageSrcs(bodyHtml, imgMap)
    if (skipped.length) new Notice(`Not uploaded (SVG or over 20 MB): ${skipped.join(', ')}`, 8000)

    const titleMatch = raw.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1].trim() : file.basename

    const html = renderFullHtml({
      title,
      bodyHtml: bodyWithImages,
      ownerName: settings.ownerName || settings.signedInEmail.split('@')[0] || 'Anonymous',
      createdAt: new Date().toISOString(),
      expiresAt: expiryToIso(result.expiry),
    })

    const response = await api.share({
      uuid: existing?.uuid || null,
      mode: result.mode,
      audience: result.audience,
      org_domain: settings.orgDomain,
      expires_at: expiryToIso(result.expiry),
      title,
      source_path: file.path,
      html,
      owner_email: settings.signedInEmail,
    })

    const newMeta: ShareMeta = {
      uuid: response.uuid,
      mode: result.mode,
      url: response.url,
      updated_at: new Date().toISOString(),
    }
    await app.vault.modify(file, applyShareMeta(raw, newMeta))
    notice.hide()
    new Notice(`Shared: ${response.url}`, 5000)
    await navigator.clipboard.writeText(response.url)
  } catch (e: any) {
    notice.hide()
    new Notice(`Share failed: ${e.message}`)
    console.error('[share-hosted]', e)
  }
}

async function stopSharing(app: App, settings: ShareHostedSettings, file: TFile, meta: ShareMeta): Promise<void> {
  const notice = new Notice('Stopping…', 0)
  try {
    const api = new ApiClient(settings.workerUrl, settings.apiToken)
    await api.unshare(meta.uuid)
    const raw = await app.vault.read(file)
    await app.vault.modify(file, removeShareMeta(raw))
    notice.hide()
    new Notice('Stopped sharing')
  } catch (e: any) {
    notice.hide()
    new Notice(`Stop failed: ${e.message}`)
  }
}
