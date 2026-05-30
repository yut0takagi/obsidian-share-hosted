import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      // The 'obsidian' package ships only type definitions (main: "").
      // Point vitest to a stub so tests can import modules that use requestUrl etc.
      obsidian: path.resolve(__dirname, 'tests/__mocks__/obsidian.ts'),
    },
  },
  test: {
    environment: 'node',
  },
})
