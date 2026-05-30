const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'

export function nanoid(length: number = 12): string {
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr).map((b) => ALPHABET[b % ALPHABET.length]).join('')
}
