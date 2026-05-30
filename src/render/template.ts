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
<script src="https://cdn.tailwindcss.com"></script>
<style>${BASE_CSS}</style>
</head>
<body class="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
<article class="mx-auto max-w-2xl px-6 py-12">
  <header class="mb-10 pb-6 border-b border-neutral-200 dark:border-neutral-800">
    <div class="text-sm text-neutral-500 dark:text-neutral-400 flex flex-wrap gap-x-2 gap-y-1">
      <span>Shared by ${escapeHtml(ownerName)}</span>
      <span class="meta-sep">·</span>
      <span>${created}</span>
      ${expiryLine}
    </div>
  </header>
  <main class="prose-content">
    ${bodyHtml}
  </main>
  <footer class="mt-16 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400">
    Powered by org-share
  </footer>
</article>
</body>
</html>`
}

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
