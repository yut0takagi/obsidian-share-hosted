# Share Hosted — Obsidian plugin

![Downloads](https://raw.githubusercontent.com/yut0takagi/obsidian-share-hosted/main/.github/stats/badge.svg)

![Download history](https://raw.githubusercontent.com/yut0takagi/obsidian-share-hosted/main/.github/stats/downloads.svg)

Share Obsidian notes with three audience modes (Org / Allowlist / Public). **No Cloudflare setup required** — just sign in with your email.

## How it works

1. Install plugin
2. Settings → Share Hosted → enter your email → click "Send magic link"
3. Click the link in your email → Obsidian opens → you're signed in
4. Open any note → Command palette → "Share this note" → pick mode → done

## Commands

| Command | What it does |
|---|---|
| **Share this note** | Modal to pick audience (Org / Specific people / Public) + expiry. Returns URL. |
| **Copy share URL** | Copies the share URL of the current note. |
| **Stop sharing** | Un-publishes the current note. |

## Audience modes

| Mode | Who can view |
|---|---|
| **Org-wide** | Anyone signed in with an email matching your configured org domain. |
| **Specific people** | Only emails you list. |
| **Public link** | Anyone with the URL. No login required. |

## Privacy

- Note content is stored on Cloudflare R2.
- Reader authentication uses Cloudflare Access (one-time PIN to email).
- Companion worker source: [obsidian-share-hosted-worker](https://github.com/yut0takagi/obsidian-share-hosted-worker).

## Status

P2A MVP — service is free, no quotas yet. May add limits if abuse becomes a problem.

## Self-hosting

If you prefer running your own backend (BYO model), see [obsidian-org-share](https://github.com/yut0takagi/obsidian-org-share) — same UX, you deploy the worker on your own Cloudflare account.

## License

MIT
