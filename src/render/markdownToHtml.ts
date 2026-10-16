import MarkdownIt from 'markdown-it'
// @ts-ignore – no type declarations for markdown-it-footnote
import footnote from 'markdown-it-footnote'
// @ts-ignore – no type declarations for markdown-it-task-lists
import taskLists from 'markdown-it-task-lists'
// @ts-ignore – no type declarations for markdown-it-anchor
import anchor from 'markdown-it-anchor'

function obsidianWikilinks(md: MarkdownIt): void {
  md.inline.ruler.before('link', 'wikilink', (state, silent) => {
    const start = state.pos
    if (state.src.slice(start, start + 2) !== '[[') return false
    const end = state.src.indexOf(']]', start + 2)
    if (end === -1) return false

    const inner = state.src.slice(start + 2, end)
    if (silent) return true

    const display = inner.includes('|') ? inner.split('|')[1].trim() : inner.trim()

    const token = state.push('html_inline', '', 0)
    token.content = `<span class="wikilink-dead">${md.utils.escapeHtml(display)}</span>`
    state.pos = end + 2
    return true
  })
}

// Image types the Worker stores. Other embeds (notes, PDF, ...) render as plain text.
const EMBED_IMAGE_RE = /\.(png|jpe?g|gif|webp|svg)$/i
const SIZE_RE = /^(\d+)(?:x(\d+))?$/

function encodeVaultPath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

function obsidianEmbeds(md: MarkdownIt): void {
  md.inline.ruler.before('image', 'wikiembed', (state, silent) => {
    const start = state.pos
    if (state.src.slice(start, start + 3) !== '![[') return false
    const end = state.src.indexOf(']]', start + 3)
    if (end === -1) return false
    if (silent) return true

    const [rawTarget, ...mods] = state.src.slice(start + 3, end).split('|').map((s) => s.trim())
    const target = rawTarget.replace(/#.*$/, '')
    const token = state.push('html_inline', '', 0)

    if (EMBED_IMAGE_RE.test(target)) {
      const name = target.split('/').pop() || target
      let alt = name
      let size = ''
      for (const m of mods) {
        const s = m.match(SIZE_RE)
        if (s) size = ` width="${s[1]}"${s[2] ? ` height="${s[2]}"` : ''}`
        else if (m) alt = m
      }
      const esc = md.utils.escapeHtml
      // ImageUploader resolves this vault path and swaps in the uploaded /a/ URL.
      token.content = `<img src="${esc(encodeVaultPath(target))}" alt="${esc(alt)}"${size}>`
    } else {
      const display = mods.find((m) => m && !SIZE_RE.test(m)) || rawTarget
      token.content = `<span class="wikilink-dead">${md.utils.escapeHtml(display)}</span>`
    }
    state.pos = end + 2
    return true
  })
}

function obsidianCallouts(md: MarkdownIt): void {
  const defaultRender =
    md.renderer.rules.blockquote_open ||
    ((tokens: any[], idx: number, opts: any, env: any, self: any) =>
      self.renderToken(tokens, idx, opts))

  md.renderer.rules.blockquote_open = function (tokens, idx, opts, env, self) {
    const next = tokens[idx + 2]
    if (next && next.type === 'inline' && next.content.startsWith('[!')) {
      const m = next.content.match(/^\[!(\w+)\]\s*(.*)/)
      if (m) {
        const [, kind, rest] = m
        next.content = rest
        tokens[idx].attrJoin('class', `callout callout-${kind.toLowerCase()}`)
      }
    }
    return defaultRender(tokens, idx, opts, env, self)
  }
}

let cached: MarkdownIt | null = null

function getMd(): MarkdownIt {
  if (cached) return cached
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: false,
    breaks: false,
  })
  md.use(footnote)
  md.use(taskLists, { enabled: false, label: true })
  md.use(anchor, { permalink: false })
  md.use(obsidianEmbeds)
  md.use(obsidianWikilinks)
  md.use(obsidianCallouts)
  cached = md
  return md
}

export function markdownToHtml(markdown: string): string {
  // Strip frontmatter before rendering
  const stripped = markdown.replace(/^---\n[\s\S]*?\n---\n?/, '')
  return getMd().render(stripped)
}
