// Stub for the 'obsidian' package in the vitest environment.
// The real implementation is provided at runtime by Obsidian's main process.
export const requestUrl = async (_params: unknown) => {
  throw new Error('obsidian.requestUrl is not available in the test environment — mock it per-test')
}
