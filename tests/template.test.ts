import { describe, it, expect } from 'vitest'
import { renderFullHtml } from '../src/render/template'

describe('renderFullHtml', () => {
  it('produces HTML with title, body, owner, date', () => {
    const out = renderFullHtml({
      title: 'My Note',
      bodyHtml: '<p>body</p>',
      ownerName: 'Takagi',
      createdAt: '2026-05-30T17:00:00Z',
      expiresAt: '2026-06-06T17:00:00Z',
    })
    expect(out).toContain('<title>My Note</title>')
    expect(out).toContain('<p>body</p>')
    expect(out).toContain('Shared by Takagi')
    expect(out).toContain('Expires')
    expect(out).toContain('noindex, nofollow')
  })

  it('omits expiry line when null', () => {
    const out = renderFullHtml({
      title: 'X',
      bodyHtml: '',
      ownerName: 'me',
      createdAt: '2026-05-30T17:00:00Z',
      expiresAt: null,
    })
    expect(out).not.toContain('Expires')
  })
})

describe('renderFullHtml: self-contained page', () => {
  const out = renderFullHtml({ title: 'X', bodyHtml: '<p>b</p>', ownerName: 'alice', createdAt: '2026-05-30T17:00:00Z', expiresAt: null })

  it('loads no scripts (the Worker serves pages with a script-free CSP)', () => {
    expect(out).not.toContain('<script')
    expect(out).not.toContain('tailwind')
  })

  it('carries its layout as inline CSS', () => {
    expect(out).toMatch(/<style>[\s\S]*max-width: 42rem[\s\S]*<\/style>/)
  })

  it('names the product in the footer', () => {
    expect(out).toContain('Shared with Share Hosted')
    expect(out).not.toContain('org-share')
  })
})
