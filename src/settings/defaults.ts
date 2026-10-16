import type { ShareHostedSettings } from './types'

export const WORKER_URL = 'https://obsidian-share-hosted-worker.takachanman-jp.workers.dev'

export const DEFAULT_SETTINGS: ShareHostedSettings = {
  workerUrl: WORKER_URL,
  signedInEmail: '',
  ownerName: '',
  serverOrg: null,
  defaultExpiry: '7d',
  defaultMode: 'org',
}
