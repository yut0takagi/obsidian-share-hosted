export type ExpiryOption = '1d' | '7d' | '30d' | 'never'

const DAY_MS = 24 * 60 * 60 * 1000

export function expiryToIso(option: ExpiryOption, now: Date = new Date()): string | null {
  switch (option) {
    case 'never':
      return null
    case '1d':
      return new Date(now.getTime() + 1 * DAY_MS).toISOString()
    case '7d':
      return new Date(now.getTime() + 7 * DAY_MS).toISOString()
    case '30d':
      return new Date(now.getTime() + 30 * DAY_MS).toISOString()
  }
}
