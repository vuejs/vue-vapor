import { mergeConfig } from 'vitest/config'
import config from './vitest.config'

export default mergeConfig(config, {
  test: {
    name: 'browser',
    include: ['packages/runtime-vapor/__benchmarks__/**/*.spec.ts'],
    benchmark: {
      include: ['packages/runtime-vapor/__benchmarks__/*.bench.ts'],
    },
    browser: {
      enabled: true,
      provider: 'playwright',
      name: 'chromium',
      headless: true,
    },
  },
})
