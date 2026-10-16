import { requestUrl } from 'obsidian'
import type { ShareInfo } from '../ui/shareDefaults'

export type ShareMode = 'org' | 'list' | 'public'

export interface ShareRequest {
  uuid: string | null
  mode: ShareMode
  audience?: string[]
  org_domain?: string
  expires_at?: string | null
  title: string
  source_path: string
  html: string
  owner_email: string
}

export interface ShareResponse { uuid: string; url: string }
export interface AssetResponse { hash: string; ext: string; url: string }

/** A non-2xx answer from the Worker. `message` prefers the Worker's own explanation. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

function errorFrom(what: string, status: number, text: string): ApiError {
  let detail = text
  try {
    const body = JSON.parse(text) as { message?: string; error?: string }
    detail = body.message || body.error || text
  } catch { /* plain text */ }
  return new ApiError(status, `${what} failed: ${status} ${detail}`.trim())
}

export class ApiClient {
  constructor(private workerUrl: string, private sessionToken: string) {}

  async share(req: ShareRequest): Promise<ShareResponse> {
    const res = await requestUrl({
      url: `${this.workerUrl}/api/share`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.sessionToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      throw: false,
    })
    if (res.status < 200 || res.status >= 300) throw errorFrom('share', res.status, res.text)
    return JSON.parse(res.text) as ShareResponse
  }

  /** The Worker's record of one of our shares, or null if it cannot say (older Worker, gone, offline). */
  async getShare(uuid: string): Promise<ShareInfo | null> {
    try {
      const res = await requestUrl({
        url: `${this.workerUrl}/api/share/${encodeURIComponent(uuid)}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.sessionToken}` },
        throw: false,
      })
      if (res.status !== 200) return null
      const body = JSON.parse(res.text) as Partial<ShareInfo>
      if (!body.mode) return null
      return { mode: body.mode, audience: body.audience ?? [], expires_at: body.expires_at ?? null }
    } catch {
      return null
    }
  }

  async unshare(uuid: string): Promise<void> {
    const res = await requestUrl({
      url: `${this.workerUrl}/api/share/${uuid}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.sessionToken}` },
      throw: false,
    })
    // The Worker answers 204 even for shares it no longer has, so a 404 means something else is wrong.
    if (res.status >= 300) throw errorFrom('unshare', res.status, res.text)
  }

  async uploadAsset(body: ArrayBuffer, hash: string, ext: string, contentType: string): Promise<AssetResponse> {
    const res = await requestUrl({
      url: `${this.workerUrl}/api/asset?hash=${encodeURIComponent(hash)}&ext=${encodeURIComponent(ext)}`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.sessionToken}`, 'Content-Type': contentType },
      body,
      throw: false,
    })
    if (res.status < 200 || res.status >= 300) throw errorFrom('asset', res.status, res.text)
    return JSON.parse(res.text) as AssetResponse
  }
}
