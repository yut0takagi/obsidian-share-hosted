// Org-wide sharing goes to everyone at the domain you signed in with. For consumer mail
// providers that "organization" is everyone with an account there, so it is not offered.
// The 0.2.0 Worker enforces the same rule and reports it from /auth/me; this copy of the
// list keeps the UI right against an older Worker.

export type ShareMode = 'org' | 'list' | 'public'

export interface OrgTarget {
  domain: string
  available: boolean
  /** Dropdown label when available, e.g. "Anyone at @example.com". */
  label: string
  /** Why it is not available, shown instead of the option. */
  reason: string
}

const FREE_MAIL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'outlook.jp', 'hotmail.com', 'hotmail.co.jp', 'hotmail.co.uk',
  'hotmail.fr', 'live.com', 'live.jp', 'msn.com', 'yahoo.com', 'yahoo.co.jp', 'yahoo.co.uk', 'yahoo.fr', 'ymail.com',
  'rocketmail.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'pm.me',
  'gmx.com', 'gmx.de', 'gmx.net', 'web.de', 'mail.com', 'zoho.com', 'yandex.com', 'yandex.ru', 'mail.ru',
  'fastmail.com', 'hey.com', 'tutanota.com', 'tuta.io', 'qq.com', '163.com', '126.com', 'naver.com',
  'docomo.ne.jp', 'ezweb.ne.jp', 'au.com', 'softbank.ne.jp', 'i.softbank.jp', 'ymobile.ne.jp',
  'nifty.com', 'biglobe.ne.jp', 'ocn.ne.jp', 'so-net.ne.jp',
])

export function emailDomain(email: string): string {
  const at = email.lastIndexOf('@')
  return at === -1 ? '' : email.slice(at + 1).trim().toLowerCase()
}

export function isFreeMailDomain(domain: string): boolean {
  return FREE_MAIL_DOMAINS.has(domain.trim().toLowerCase())
}

export function orgTarget(email: string, fromServer?: { domain: string; available: boolean } | null): OrgTarget {
  const domain = fromServer?.domain || emailDomain(email)
  if (!domain) {
    return { domain: '', available: false, label: '', reason: 'Sign in to share with your organization.' }
  }
  const available = fromServer ? fromServer.available : !isFreeMailDomain(domain)
  if (!available) {
    return {
      domain,
      available: false,
      label: '',
      reason: `Org-wide sharing is not available for @${domain} addresses: anyone with an address there could open the note. Share with specific people instead.`,
    }
  }
  return { domain, available: true, label: `Anyone at @${domain}`, reason: '' }
}

export function effectiveDefaultMode(mode: ShareMode, org: OrgTarget): ShareMode {
  return mode === 'org' && !org.available ? 'list' : mode
}
