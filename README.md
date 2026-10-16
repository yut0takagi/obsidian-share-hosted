# Share Hosted — Obsidian plugin

![Downloads](https://raw.githubusercontent.com/yut0takagi/obsidian-share-hosted/main/.github/stats/badge.svg)

![Download history](https://raw.githubusercontent.com/yut0takagi/obsidian-share-hosted/main/.github/stats/downloads.svg)

Share Obsidian notes with three audience modes (Org / Allowlist / Public). **No Cloudflare setup required** — just sign in with your email.

## How it works

1. Install plugin
2. Settings → Share Hosted → enter your email → click "Send magic link"
3. Open the link in your email on the same device → confirm → Obsidian opens → you're signed in
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
| **Org-wide** | Anyone whose email is at the domain you signed in with (for example `@example.com`). Not offered for consumer mail such as Gmail or Outlook.com, where that would mean everyone. |
| **Specific people** | Only emails you list. |
| **Public link** | Anyone with the URL. No login required. |

Re-sharing a note opens the dialog with its current audience and expiry. Recipient
addresses are kept on the server, not in the note's frontmatter.

Images embedded with `![[image.png]]` or `![](image.png)` are uploaded with the note
(PNG, JPEG, GIF, WebP, SVG up to 20 MB).

## Privacy and security

- Note content is stored on Cloudflare R2.
- Reader authentication uses Cloudflare Access (one-time PIN to email).
- Your session is stored in Obsidian's secret storage (Obsidian 1.11.4 or later), not in the
  plugin's `data.json`, so it does not travel with your vault through sync or git. On older
  Obsidian versions it stays in `data.json` as before. Sessions last 30 days.
- The sign-in link opens a confirmation page first, and only a sign-in started from this
  device is accepted. Obsidian receives a short-lived one-time code and trades it for the
  session, so the session itself never appears in a link or your browser history.
  "Sign out everywhere" in settings ends all your sessions.
- Shared pages run no scripts and stopping a share also deletes images no other note uses.
- Images are served from a URL derived from the image's content. That URL is not tied to the
  note's audience: anyone who has it can open the image, even for org-wide or
  specific-people notes. This has been the design since 0.1.0; avoid sharing images you
  could not show to someone who gets hold of the link.
- Companion worker source: [obsidian-share-hosted-worker](https://github.com/yut0takagi/obsidian-share-hosted-worker).

## Status

P2A MVP — service is free, no quotas yet. May add limits if abuse becomes a problem.

## Self-hosting

If you prefer running your own backend (BYO model), see [obsidian-org-share](https://github.com/yut0takagi/obsidian-org-share) — same UX, you deploy the worker on your own Cloudflare account.

## License

MIT
