import { expiryToIso, type ExpiryOption } from '../util/expiry'
import { effectiveDefaultMode, type OrgTarget, type ShareMode } from '../settings/orgDomain'

/** 'keep' re-uses the expiry the share already has. */
export type ExpiryChoice = ExpiryOption | 'keep'

export interface ShareInfo {
  mode: ShareMode
  audience: string[]
  expires_at: string | null
}

export interface ModalDefaults {
  mode: ShareMode
  audienceText: string
  expiry: ExpiryChoice
  keepUntil: string | null
}

/**
 * Initial dialog values. On re-share the Worker's record wins (recipients are never kept in
 * frontmatter); against an older Worker `info` is null and settings are used as before.
 */
export function modalDefaults(input: {
  info: ShareInfo | null
  existingMode: ShareMode | null
  settings: { defaultMode: ShareMode; defaultExpiry: ExpiryOption }
  org: OrgTarget
  now: Date
}): ModalDefaults {
  const { info, existingMode, settings, org, now } = input
  const mode = effectiveDefaultMode(info?.mode ?? existingMode ?? settings.defaultMode, org)
  const audienceText = (info?.audience ?? []).join('\n')

  let expiry: ExpiryChoice = settings.defaultExpiry
  let keepUntil: string | null = null
  if (info) {
    if (info.expires_at === null) expiry = 'never'
    else if (Date.parse(info.expires_at) > now.getTime()) {
      expiry = 'keep'
      keepUntil = info.expires_at
    }
  }
  return { mode, audienceText, expiry, keepUntil }
}

export function resolveExpiry(choice: ExpiryChoice, keepUntil: string | null, now: Date): string | null {
  if (choice === 'keep') return keepUntil
  return expiryToIso(choice, now)
}
