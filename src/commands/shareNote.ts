import { Notice, TFile } from 'obsidian'
import type ShareHostedPlugin from '../../main'
import { ApiClient, ApiError, type ShareRequest } from '../upload/ApiClient'
import { ImageUploader } from '../upload/ImageUploader'
import { markdownToHtml } from '../render/markdownToHtml'
import { renderFullHtml } from '../render/template'
import { parseShareMeta, applyShareMeta, removeShareMeta, type ShareMeta } from '../frontmatter/shareMeta'
import { ShareModal } from '../ui/ShareModal'
import { SharedStatusModal } from '../ui/SharedStatusModal'
import { modalDefaults, resolveExpiry } from '../ui/shareDefaults'
import { orgTarget } from '../settings/orgDomain'

export async function shareNoteCommand(plugin: ShareHostedPlugin, file: TFile | null): Promise<void> {
  if (!file) { new Notice('No active note'); return }
  if (!plugin.tokens.get()) { new Notice('Sign in first in plugin settings'); return }

  const content = await plugin.app.vault.read(file)
  const existing = parseShareMeta(content)

  if (existing) {
    new SharedStatusModal(plugin.app, existing, {
      onUpdate: () => runShareFlow(plugin, file, existing),
      onStop: () => stopSharing(plugin, file, existing),
    }).open()
    return
  }
  await runShareFlow(plugin, file, null)
}

async function runShareFlow(plugin: ShareHostedPlugin, file: TFile, existing: ShareMeta | null): Promise<void> {
  const { app, settings } = plugin
  const api = new ApiClient(settings.workerUrl, plugin.tokens.get())
  const org = orgTarget(settings.signedInEmail, settings.serverOrg)
  // Recipients and expiry live on the Worker only; null against a 0.1.0 Worker.
  const info = existing ? await api.getShare(existing.uuid) : null
  const defaults = modalDefaults({ info, existingMode: existing?.mode ?? null, settings, org, now: new Date() })

  const modal = new ShareModal(app, { ...defaults, org })
  const result = await modal.open()
  if (!result) return

  const notice = new Notice('Sharing…', 0)
  try {
    const uploader = new ImageUploader(app, api)

    const raw = await app.vault.read(file)
    const bodyHtml = markdownToHtml(raw)
    const { map: imgMap, skipped } = await uploader.uploadImagesIn(bodyHtml, file.path)
    const bodyWithImages = ImageUploader.rewriteImageSrcs(bodyHtml, imgMap)
    if (skipped.length) new Notice(`Not uploaded (SVG or over 20 MB): ${skipped.join(', ')}`, 8000)

    const titleMatch = raw.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1].trim() : file.basename
    const expiresAt = resolveExpiry(result.expiry, defaults.keepUntil, new Date())

    const html = renderFullHtml({
      title,
      bodyHtml: bodyWithImages,
      ownerName: settings.ownerName || settings.signedInEmail.split('@')[0] || 'Anonymous',
      createdAt: new Date().toISOString(),
      expiresAt,
    })

    const request: ShareRequest = {
      uuid: existing?.uuid || null,
      mode: result.mode,
      audience: result.audience,
      // A 0.1.0 Worker stores whatever is sent here; send the sign-in domain so it matches 0.2.0.
      org_domain: result.mode === 'org' ? org.domain : undefined,
      expires_at: expiresAt,
      title,
      source_path: file.path,
      html,
      owner_email: settings.signedInEmail,
    }

    let response
    try {
      response = await api.share(request)
    } catch (e) {
      // The old link was stopped elsewhere or cleaned up after expiry: publish under a new link.
      if (!(e instanceof ApiError && e.status === 404 && request.uuid)) throw e
      response = await api.share({ ...request, uuid: null })
      new Notice('The previous link no longer exists, so this note got a new link.', 8000)
    }

    const newMeta: ShareMeta = {
      uuid: response.uuid,
      mode: result.mode,
      url: response.url,
      updated_at: new Date().toISOString(),
    }
    await app.vault.modify(file, applyShareMeta(await app.vault.read(file), newMeta))
    notice.hide()
    new Notice(`Shared: ${response.url}`, 5000)
    await navigator.clipboard.writeText(response.url)
  } catch (e: any) {
    notice.hide()
    if (e instanceof ApiError && e.status === 401) {
      await plugin.tokens.clear()
      plugin.settings.signedInEmail = ''
      await plugin.saveSettings()
      new Notice('Your Share Hosted session has ended. Sign in again in Settings → Share Hosted.', 10000)
      return
    }
    new Notice(`Share failed: ${e.message}`)
    console.error('[share-hosted]', e)
  }
}

async function stopSharing(plugin: ShareHostedPlugin, file: TFile, meta: ShareMeta): Promise<void> {
  const notice = new Notice('Stopping…', 0)
  try {
    const api = new ApiClient(plugin.settings.workerUrl, plugin.tokens.get())
    await api.unshare(meta.uuid)
    const raw = await plugin.app.vault.read(file)
    await plugin.app.vault.modify(file, removeShareMeta(raw))
    notice.hide()
    new Notice('Stopped sharing')
  } catch (e: any) {
    notice.hide()
    new Notice(`Stop failed: ${e.message}`)
  }
}
