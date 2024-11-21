import { configDefaults, mergeConfig } from 'vitest/config'
import config from './vitest.config'

export default mergeConfig(config, {
  test: {
    name: 'unit',
    exclude: [
      ...configDefaults.exclude,
      '**/e2e/**',
      'packages/runtime-vapor/__benchmarks__/**',
    ],
    benchmark: {
      include: ['packages/runtime-vapor/__benchmarks__/*.bench.ts'],
    },
  },
})
