export interface ShareMeta {
  uuid: string
  mode: 'org' | 'list' | 'public'
  url: string
  updated_at: string
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/

function uuidFromUrl(url: string): string {
  const parts = url.split('/')
  return parts[parts.length - 1] || ''
}

function parseFlatYaml(fm: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of fm.split('\n')) {
    const m = line.match(/^([a-zA-Z_][\w]*):\s*(.+)$/)
    if (m) result[m[1]] = m[2].trim()
  }
  return result
}

function parseLegacyNestedShare(fm: string): ShareMeta | null {
  const shareIdx = fm.indexOf('share:')
  if (shareIdx === -1) return null
  const lines = fm.slice(shareIdx).split('\n')
  if (lines[0].trim() !== 'share:') return null
  const result: Record<string, string> = {}
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.startsWith('  ')) break
    const trimmed = line.trim()
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx === -1) continue
    result[trimmed.slice(0, colonIdx).trim()] = trimmed.slice(colonIdx + 1).trim()
  }
  if (!result.uuid || !result.mode || !result.url || !result.updated_at) return null
  return {
    uuid: result.uuid,
    mode: result.mode as ShareMeta['mode'],
    url: result.url,
    updated_at: result.updated_at,
  }
}

export function parseShareMeta(md: string): ShareMeta | null {
  const m = md.match(FRONTMATTER_RE)
  if (!m) return null
  const fm = m[1]

  // Try new flat format first
  const flat = parseFlatYaml(fm)
  if (flat.share_url && flat.share_mode) {
    return {
      uuid: uuidFromUrl(flat.share_url),
      mode: flat.share_mode as ShareMeta['mode'],
      url: flat.share_url,
      updated_at: flat.share_updated_at || new Date().toISOString(),
    }
  }

  // Fall back to legacy nested format
  return parseLegacyNestedShare(fm)
}

const SHARE_KEY_RE = /^share_(url|mode|uuid|updated_at)\s*:/

function stripShareKeys(fmLines: string[]): string[] {
  const result: string[] = []
  let i = 0
  while (i < fmLines.length) {
    const line = fmLines[i]
    // Legacy nested share: block
    if (line.trim() === 'share:') {
      i++
      while (i < fmLines.length && fmLines[i].startsWith('  ')) i++
      continue
    }
    // Flat share_* keys
    if (SHARE_KEY_RE.test(line)) {
      i++
      continue
    }
    result.push(line)
    i++
  }
  return result
}

export function applyShareMeta(md: string, meta: ShareMeta): string {
  const m = md.match(FRONTMATTER_RE)
  const newKeys = [
    `share_url: ${meta.url}`,
    `share_mode: ${meta.mode}`,
  ]

  if (!m) {
    return `---\n${newKeys.join('\n')}\n---\n${md}`
  }

  const existing = stripShareKeys(m[1].split('\n')).filter((l) => l.length > 0)
  const combined = [...existing, ...newKeys].join('\n')
  return md.replace(FRONTMATTER_RE, `---\n${combined}\n---\n`)
}

export function removeShareMeta(md: string): string {
  const m = md.match(FRONTMATTER_RE)
  if (!m) return md
  const remaining = stripShareKeys(m[1].split('\n')).filter((l) => l.length > 0)
  if (remaining.length === 0) {
    return md.replace(FRONTMATTER_RE, '')
  }
  return md.replace(FRONTMATTER_RE, `---\n${remaining.join('\n')}\n---\n`)
}
