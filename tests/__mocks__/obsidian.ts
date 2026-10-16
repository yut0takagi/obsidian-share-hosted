// Stub for the 'obsidian' package in the vitest environment.
// The real implementation is provided at runtime by Obsidian's main process.
export const requestUrl = async (_params: unknown) => {
  throw new Error('obsidian.requestUrl is not available in the test environment — mock it per-test')
}

// Minimal TFile so `instanceof TFile` checks work in tests.
export class TFile {
  path = ''
  name = ''
  basename = ''
  extension = ''
  stat = { size: 0, ctime: 0, mtime: 0 }
}

export class Notice {
  static messages: string[] = []
  constructor(public message: string, _timeout?: number) { Notice.messages.push(message) }
  hide() {}
}
