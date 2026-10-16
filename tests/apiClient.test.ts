import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestUrl = vi.fn()
vi.mock('obsidian', () => ({ requestUrl: (p: unknown) => requestUrl(p) }))

const { ApiClient, ApiError } = await import('../src/upload/ApiClient')

beforeEach(() => { requestUrl.mockReset() })

describe('ApiClient.getShare', () => {
  it('returns mode, recipients and expiry from the Worker', async () => {
    requestUrl.mockResolvedValue({ status: 200, text: JSON.stringify({ uuid: 'u1', mode: 'list', audience: ['bob@example.com'], expires_at: null, url: 'https://w.example/n/u1' }) })
    const info = await new ApiClient('https://w.example', 's_tok').getShare('u1')
    expect(info).toMatchObject({ mode: 'list', audience: ['bob@example.com'], expires_at: null })
    expect(requestUrl.mock.calls[0][0]).toMatchObject({ url: 'https://w.example/api/share/u1', method: 'GET', headers: { Authorization: 'Bearer s_tok' } })
  })

  it('returns null when the Worker does not have the endpoint or the share', async () => {
    requestUrl.mockResolvedValue({ status: 404, text: 'Not Found' })
    expect(await new ApiClient('https://w.example', 's_tok').getShare('u1')).toBeNull()
  })

  it('returns null when the request itself fails', async () => {
    requestUrl.mockRejectedValue(new Error('offline'))
    expect(await new ApiClient('https://w.example', 's_tok').getShare('u1')).toBeNull()
  })
})

describe('ApiClient.share', () => {
  it('throws an ApiError carrying the status and the Worker message', async () => {
    requestUrl.mockResolvedValue({ status: 404, text: JSON.stringify({ error: 'share not found' }) })
    const err = await new ApiClient('https://w.example', 's_tok').share({ uuid: 'gone', mode: 'public', title: 't', source_path: 't.md', html: '<p>x</p>', owner_email: 'a@example.com' }).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(404)
    expect(err.message).toContain('share not found')
  })
})
