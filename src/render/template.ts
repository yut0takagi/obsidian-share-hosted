export interface TemplateInput {
  title: string
  bodyHtml: string
  ownerName: string
  createdAt: string  // ISO
  expiresAt: string | null  // ISO or null
}

export function renderFullHtml(input: TemplateInput): string {
  const { title, bodyHtml, ownerName, createdAt, expiresAt } = input
  const created = new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const expiryLine = expiresAt
    ? `<span class="meta-sep">·</span> <span>Expires ${new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(title)}</title>
<style>${RESET_CSS}${LAYOUT_CSS}${BASE_CSS}</style>
</head>
<body>
<article class="page">
  <header class="page-header">
    <div class="page-meta">
      <span>Shared by ${escapeHtml(ownerName)}</span>
      <span class="meta-sep">·</span>
      <span>${created}</span>
      ${expiryLine}
    </div>
  </header>
  <main class="prose-content">
    ${bodyHtml}
  </main>
  <footer class="page-footer">
    Shared with Share Hosted
  </footer>
</article>
</body>
</html>`
}

// The page is self-contained: the Worker serves it with a CSP that allows no scripts, so the
// Tailwind CDN that 0.1.0 used is gone. RESET_CSS and LAYOUT_CSS reproduce what it provided.
const RESET_CSS = `
*, ::before, ::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: #e5e7eb; }
html { line-height: 1.5; -webkit-text-size-adjust: 100%; tab-size: 4; }
body { margin: 0; line-height: inherit; }
hr { height: 0; color: inherit; border-top-width: 1px; }
h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
a { color: inherit; text-decoration: inherit; }
b, strong { font-weight: bolder; }
code, kbd, samp, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 1em; }
sub, sup { font-size: 75%; line-height: 0; position: relative; vertical-align: baseline; }
sub { bottom: -0.25em; } sup { top: -0.5em; }
table { text-indent: 0; border-color: inherit; border-collapse: collapse; }
blockquote, dl, dd, h1, h2, h3, h4, h5, h6, hr, figure, p, pre { margin: 0; }
ol, ul, menu { list-style: none; margin: 0; padding: 0; }
img, svg, video { display: block; vertical-align: middle; }
img, video { max-width: 100%; height: auto; }
input { font-family: inherit; font-size: 100%; margin: 0; padding: 0; color: inherit; }
`

const LAYOUT_CSS = `
body { background: #fff; color: #171717; }
.page { max-width: 42rem; margin: 0 auto; padding: 3rem 1.5rem; }
.page-header { margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e5e5e5; }
.page-meta { display: flex; flex-wrap: wrap; column-gap: 0.5rem; row-gap: 0.25rem; font-size: 0.875rem; line-height: 1.25rem; color: #737373; }
.page-footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid #e5e5e5; font-size: 0.75rem; line-height: 1rem; color: #a3a3a3; }
@media (prefers-color-scheme: dark) {
  body { background: #171717; color: #f5f5f5; }
  .page-header, .page-footer { border-color: #262626; }
  .page-meta { color: #a3a3a3; }
}
`

const BASE_CSS = `
:root { font-family: Inter, system-ui, -apple-system, "Hiragino Sans", sans-serif; }
.prose-content { line-height: 1.8; font-size: 1rem; color: #171717; }
.prose-content h1, .prose-content h2, .prose-content h3 { font-family: "Yu Mincho", Georgia, serif; font-weight: 700; letter-spacing: -0.01em; }
.prose-content h1 { font-size: 2.25rem; margin: 2rem 0 1.25rem; }
.prose-content h2 { font-size: 1.75rem; margin: 2rem 0 1rem; }
.prose-content h3 { font-size: 1.375rem; margin: 1.5rem 0 0.75rem; }
.prose-content p { margin: 0 0 1.25rem; }
.prose-content ul, .prose-content ol { margin: 0 0 1.25rem 1.5rem; }
.prose-content li { margin: 0.25rem 0; }
.prose-content blockquote { border-left: 3px solid #d4d4d4; padding-left: 1rem; color: #525252; margin: 1.25rem 0; }
.prose-content code { background: #f5f5f5; color: #1a1a1a; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875em; }
.prose-content pre { background: #1e1e1e; color: #e5e5e5; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1.25rem 0; }
.prose-content pre code { background: transparent; padding: 0; color: inherit; }
.prose-content table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; }
.prose-content th, .prose-content td { border: 1px solid #e5e5e5; padding: 0.5rem 0.75rem; text-align: left; }
.prose-content th { background: #f5f5f5; font-weight: 600; }
.prose-content img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0; }
.prose-content a { color: #2563eb; text-decoration: underline; text-underline-offset: 2px; }
.prose-content .wikilink-dead { color: #737373; background: #f5f5f5; padding: 0 0.25rem; border-radius: 0.25rem; font-size: 0.9em; }
.prose-content .callout { border-left: 4px solid #2563eb; background: #eff6ff; color: #1e3a8a; padding: 0.75rem 1rem; margin: 1.25rem 0; border-radius: 0 0.5rem 0.5rem 0; }
.prose-content .callout-warning { border-left-color: #f59e0b; background: #fffbeb; color: #78350f; }
.prose-content .callout-danger, .prose-content .callout-error { border-left-color: #ef4444; background: #fef2f2; color: #7f1d1d; }
.meta-sep { opacity: 0.5; }

@media (prefers-color-scheme: dark) {
  .prose-content { color: #e5e5e5; }
  .prose-content blockquote { border-left-color: #404040; color: #a3a3a3; }
  .prose-content code { background: #262626; color: #e5e5e5; }
  .prose-content th, .prose-content td { border-color: #404040; }
  .prose-content th { background: #262626; }
  .prose-content a { color: #60a5fa; }
  .prose-content .wikilink-dead { color: #a3a3a3; background: #262626; }
  .prose-content .callout { background: #1e293b; border-left-color: #60a5fa; color: #cbd5e1; }
  .prose-content .callout-warning { background: #292524; color: #fde68a; }
  .prose-content .callout-danger, .prose-content .callout-error { background: #2c1818; color: #fecaca; }
}
`

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
