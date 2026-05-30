import { describe, it, expect } from 'vitest'
import { parseShareMeta, applyShareMeta, removeShareMeta, type ShareMeta } from '../src/frontmatter/shareMeta'

describe('parseShareMeta (flat format)', () => {
  it('returns null when no frontmatter', () => {
    expect(parseShareMeta('Hello body')).toBeNull()
  })

  it('returns null when frontmatter has no share keys', () => {
    expect(parseShareMeta('---\ntitle: foo\n---\nBody')).toBeNull()
  })

  it('parses flat share_url and share_mode', () => {
    const md = `---
title: foo
share_url: https://example.com/n/abc123
share_mode: org
---
Body`
    const meta = parseShareMeta(md)
    expect(meta?.url).toBe('https://example.com/n/abc123')
    expect(meta?.mode).toBe('org')
    expect(meta?.uuid).toBe('abc123')  // derived from URL
  })

  it('derives uuid from /p/ URLs too', () => {
    const md = `---
share_url: https://example.com/p/xyz789
share_mode: public
---
Body`
    expect(parseShareMeta(md)?.uuid).toBe('xyz789')
  })
})

describe('parseShareMeta (legacy nested format)', () => {
  it('still parses old nested share: block', () => {
    const md = `---
title: foo
share:
  uuid: legacy-uuid
  mode: org
  url: https://example.com/n/legacy-uuid
  updated_at: 2026-05-30T17:00:00Z
---
Body`
    const meta = parseShareMeta(md)
    expect(meta?.uuid).toBe('legacy-uuid')
    expect(meta?.mode).toBe('org')
    expect(meta?.url).toBe('https://example.com/n/legacy-uuid')
  })
})

describe('applyShareMeta', () => {
  it('adds flat keys to note without frontmatter', () => {
    const md = 'Hello body'
    const meta: ShareMeta = { uuid: 'abc', mode: 'public', url: 'https://x/p/abc', updated_at: '2026-05-30T17:00:00Z' }
    const out = applyShareMeta(md, meta)
    expect(out).toMatch(/^---\nshare_url: https:\/\/x\/p\/abc\nshare_mode: public\n---\n/)
    expect(out).toContain('Hello body')
  })

  it('replaces flat keys, preserves other frontmatter', () => {
    const md = `---
title: foo
share_url: https://x/n/old
share_mode: org
---
Body`
    const meta: ShareMeta = { uuid: 'new', mode: 'public', url: 'https://x/p/new', updated_at: '2026-05-30T17:00:00Z' }
    const out = applyShareMeta(md, meta)
    expect(out).toContain('title: foo')
    expect(out).toContain('share_url: https://x/p/new')
    expect(out).toContain('share_mode: public')
    expect(out).not.toContain('share_url: https://x/n/old')
    expect(out).not.toContain('share_mode: org')
  })

  it('migrates legacy nested share: block to flat keys', () => {
    const md = `---
title: foo
share:
  uuid: old
  mode: org
  url: https://x/n/old
  updated_at: 2020-01-01T00:00:00Z
---
Body`
    const meta: ShareMeta = { uuid: 'new', mode: 'public', url: 'https://x/p/new', updated_at: '2026-05-30T17:00:00Z' }
    const out = applyShareMeta(md, meta)
    expect(out).toContain('title: foo')
    expect(out).toContain('share_url: https://x/p/new')
    expect(out).toContain('share_mode: public')
    expect(out).not.toContain('share:')  // legacy block stripped
    expect(out).not.toContain('uuid: old')
  })
})

describe('removeShareMeta', () => {
  it('removes flat share_* keys, keeps other frontmatter', () => {
    const md = `---
title: foo
share_url: https://x/n/abc
share_mode: org
---
Body`
    const out = removeShareMeta(md)
    expect(out).toContain('title: foo')
    expect(out).not.toContain('share_url')
    expect(out).not.toContain('share_mode')
  })

  it('removes legacy nested share: block', () => {
    const md = `---
title: foo
share:
  uuid: abc
  mode: org
  url: https://x/n/abc
  updated_at: 2026-05-30T17:00:00Z
---
Body`
    const out = removeShareMeta(md)
    expect(out).toContain('title: foo')
    expect(out).not.toContain('share:')
    expect(out).not.toContain('uuid: abc')
  })

  it('removes whole frontmatter if only share keys present', () => {
    const md = `---
share_url: https://x/p/abc
share_mode: public
---
Body`
    expect(removeShareMeta(md)).toBe('Body')
  })
})
