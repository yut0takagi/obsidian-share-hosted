export interface ShareHostedSettings {
  workerUrl: string
  apiToken: string
  signedInEmail: string
  ownerName: string
  orgDomain: string
  defaultExpiry: '1d' | '7d' | '30d' | 'never'
  defaultMode: 'org' | 'list' | 'public'
}
