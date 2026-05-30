import { describe, it, expect } from 'vitest'
import { markdownToHtml } from '../src/render/markdownToHtml'

describe('markdownToHtml', () => {
  it('renders basic markdown', () => {
    const out = markdownToHtml('# Title\n\nSome **bold**.')
    expect(out).toContain('<h1')
    expect(out).toContain('Title</h1>')
    expect(out).toContain('<strong>bold</strong>')
  })

  it('converts wikilinks to span (no href)', () => {
    const out = markdownToHtml('See [[Other Note]] for details.')
    expect(out).toContain('<span class="wikilink-dead">Other Note</span>')
    expect(out).not.toContain('href')
  })

  it('strips wikilink aliases', () => {
    const out = markdownToHtml('See [[Other Note|alias]].')
    expect(out).toContain('<span class="wikilink-dead">alias</span>')
  })

  it('renders task lists', () => {
    const out = markdownToHtml('- [x] done\n- [ ] todo')
    expect(out).toContain('type="checkbox"')
    expect(out).toContain('checked')
  })

  it('renders code blocks with language class', () => {
    const out = markdownToHtml('```js\nconst x = 1\n```')
    expect(out).toContain('<code class="language-js">')
  })

  it('renders Obsidian callout as blockquote with class', () => {
    const out = markdownToHtml('> [!note]\n> info text')
    expect(out).toContain('class="callout callout-note"')
    expect(out).toContain('info text')
  })
})
