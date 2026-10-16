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

describe('markdownToHtml: Obsidian image embeds', () => {
  it('renders ![[image.png]] as an <img> without the "!"', () => {
    const out = markdownToHtml('Look: ![[photo.png]]')
    expect(out).toContain('<img src="photo.png" alt="photo.png">')
    expect(out).not.toContain('!')
    expect(out).not.toContain('wikilink-dead')
  })

  it('percent-encodes the path so the uploader can resolve names with spaces', () => {
    expect(markdownToHtml('![[Pasted image 20240101.png]]')).toContain('src="Pasted%20image%2020240101.png"')
    expect(markdownToHtml('![[assets/a&b.jpg]]')).toContain('src="assets/a%26b.jpg"')
  })

  it('applies Obsidian size modifiers', () => {
    expect(markdownToHtml('![[photo.png|300]]')).toContain('<img src="photo.png" alt="photo.png" width="300">')
    expect(markdownToHtml('![[photo.png|300x200]]')).toContain('width="300" height="200"')
  })

  it('uses other modifiers as alt text, escaped', () => {
    expect(markdownToHtml('![[photo.png|A "quoted" diagram]]')).toContain('alt="A &quot;quoted&quot; diagram"')
  })

  it('handles upper-case extensions and #anchors', () => {
    expect(markdownToHtml('![[Shot.JPG#center]]')).toContain('<img src="Shot.JPG" alt="Shot.JPG">')
  })

  it('shows other embeds (notes, SVG, PDF) as plain text without the "!"', () => {
    const note = markdownToHtml('![[Other Note]]')
    expect(note).toContain('<span class="wikilink-dead">Other Note</span>')
    expect(note).not.toContain('!')
    expect(markdownToHtml('![[diagram.svg]]')).toContain('<span class="wikilink-dead">diagram.svg</span>')
  })

  it('leaves standard Markdown images alone', () => {
    expect(markdownToHtml('![alt](pic.png)')).toContain('<img src="pic.png" alt="alt">')
  })
})
