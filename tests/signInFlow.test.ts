import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestUrl = vi.fn()
vi.mock('obsidian', () => ({ requestUrl: (p: unknown) => requestUrl(p) }))

const { requestMagicLink, exchangeCode } = await import('../src/auth/SignInFlow')
const { PendingStore } = await import('../src/auth/PendingStore')

function fakePlugin() {
  const settings: any = { workerUrl: 'https://w.example' }
  const plugin: any = { settings, saveSettings: vi.fn(async () => {}) }
  plugin.pending = new PendingStore(null, settings, plugin.saveSettings)
  return plugin
}

beforeEach(() => { requestUrl.mockReset() })

describe('requestMagicLink', () => {
  it('remembers the state only after the Worker accepted the request', async () => {
    const plugin = fakePlugin()
    requestUrl.mockResolvedValue({ status: 200, text: '{"ok":true}' })
    await requestMagicLink(plugin, 'alice@example.com')
    const sent = JSON.parse(requestUrl.mock.calls[0][0].body)
    expect(plugin.pending.get().map((p: { state: string }) => p.state)).toEqual([sent.state])
  })

  it('keeps the earlier link valid when a later request is refused', async () => {
    const plugin = fakePlugin()
    requestUrl.mockResolvedValueOnce({ status: 200, text: '{"ok":true}' })
    await requestMagicLink(plugin, 'alice@example.com')
    const before = plugin.pending.get()
    requestUrl.mockResolvedValueOnce({ status: 429, text: JSON.stringify({ error: 'rate_limited', message: 'Try again later.' }) })
    await expect(requestMagicLink(plugin, 'alice@example.com')).rejects.toThrow('Try again later.')
    expect(plugin.pending.get()).toEqual(before)
  })

  it('keeps both links valid when two requests went out', async () => {
    const plugin = fakePlugin()
    requestUrl.mockResolvedValue({ status: 200, text: '{"ok":true}' })
    await requestMagicLink(plugin, 'alice@example.com')
    await requestMagicLink(plugin, 'alice@example.com')
    expect(plugin.pending.get()).toHaveLength(2)
  })
})

describe('exchangeCode', () => {
  it('trades the code and state for the session token', async () => {
    const plugin = fakePlugin()
    requestUrl.mockResolvedValue({ status: 200, text: JSON.stringify({ api_token: 's_tok', email: 'alice@example.com' }) })
    expect(await exchangeCode(plugin, 'c_abc', 'st_state_value_0123456789')).toEqual({ token: 's_tok', email: 'alice@example.com' })
    const call = requestUrl.mock.calls[0][0]
    expect(call.url).toBe('https://w.example/auth/exchange')
    expect(call.method).toBe('POST')
    expect(JSON.parse(call.body)).toEqual({ code: 'c_abc', state: 'st_state_value_0123456789' })
  })

  it('throws the Worker message when the code is no longer valid', async () => {
    const plugin = fakePlugin()
    requestUrl.mockResolvedValue({ status: 400, text: JSON.stringify({ error: 'invalid_code', message: 'This sign-in has expired.' }) })
    await expect(exchangeCode(plugin, 'c_abc', 'st_state_value_0123456789')).rejects.toThrow('This sign-in has expired.')
  })
})
