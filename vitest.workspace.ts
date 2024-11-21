import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  './vitest.unit.config.ts',
  './vitest.e2e.config.ts',
  './vitest.browser.config.ts',
])
