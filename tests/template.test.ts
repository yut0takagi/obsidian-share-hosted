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
