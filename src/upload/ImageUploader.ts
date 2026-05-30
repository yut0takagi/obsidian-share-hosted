import { App, TFile } from 'obsidian'
import { ApiClient } from './ApiClient'

export interface UploadedImage {
  originalSrc: string
  remotePath: string  // /a/{hash}.{ext}
}

const EXT_TO_CT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buf)
  const bytes = new Uint8Array(hash)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

export class ImageUploader {
  constructor(private app: App, private api: ApiClient) {}

  /**
   * Scans rendered HTML for <img src="..."> referencing vault files (or wiki-embed paths),
   * uploads each, returns a map of original-src → /a/{hash}.{ext}.
   */
  async uploadImagesIn(html: string, sourceNotePath: string): Promise<Map<string, string>> {
    const result = new Map<string, string>()
    const srcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1])
    const uniq = Array.from(new Set(srcs))

    for (const src of uniq) {
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('/a/')) continue
      const file = this.resolveVaultFile(src, sourceNotePath)
      if (!file) continue
      const buf = await this.app.vault.readBinary(file)
      const ext = (file.extension || 'png').toLowerCase()
      if (!EXT_TO_CT[ext]) continue
      const hash = await sha256Hex(buf)
      await this.api.uploadAsset(buf, hash, ext, EXT_TO_CT[ext])
      result.set(src, `/a/${hash}.${ext}`)
    }
    return result
  }

  private resolveVaultFile(src: string, sourceNotePath: string): TFile | null {
    // Try direct path
    let file = this.app.vault.getAbstractFileByPath(src)
    if (file instanceof TFile) return file

    // Try resolved relative
    const resolved = this.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(src), sourceNotePath)
    if (resolved) return resolved
    return null
  }

  static rewriteImageSrcs(html: string, map: Map<string, string>): string {
    return html.replace(/<img([^>]+)src="([^"]+)"([^>]*)>/g, (full, before, src, after) => {
      const replacement = map.get(src)
      if (!replacement) return full
      return `<img${before}src="${replacement}"${after}>`
    })
  }
}
