/* eslint-disable no-restricted-syntax */

// @ts-check
import path from 'node:path'
import connect from 'connect'
import Vue from '@vitejs/plugin-vue'
import { build } from 'vite'
import { exec } from '../scripts/utils.js'
import sirv from 'sirv'
import { launch } from 'puppeteer'

const PORT = 8193

await buildVapor()
await buildApp()
const server = startServer()
await bench()
server.close()

process.on('SIGTERM', () => {
  server.close()
})

async function buildVapor() {
  console.info('Building Vapor...')
  const options = {
    cwd: path.resolve(import.meta.dirname, '..'),
    stdio: 'inherit',
  }
  const [{ ok }, { ok: ok2 }, { ok: ok3 }] = await Promise.all([
    exec(
      'pnpm',
      'run build shared compiler-core compiler-dom compiler-vapor -pf cjs'.split(
        ' ',
      ),
      options,
    ),
    exec(
      'pnpm',
      'run build compiler-sfc compiler-ssr -f cjs'.split(' '),
      options,
    ),
    exec('pnpm', 'run build vue-vapor -pf esm-browser'.split(' '), options),
  ])

  if (!ok || !ok2 || !ok3) {
    console.error('Failed to build')
    process.exit(1)
  }
}

async function buildApp() {
  console.info('Building app...')

  process.env.NODE_ENV = 'production'
  const CompilerSFC = await import(
    '../packages/compiler-sfc/dist/compiler-sfc.cjs.js'
  )
  const CompilerVapor = await import(
    '../packages/compiler-vapor/dist/compiler-vapor.cjs.prod.js'
  )

  const vaporRuntime = path.resolve(
    import.meta.dirname,
    '../packages/vue-vapor/dist/vue-vapor.esm-browser.prod.js',
  )
  await build({
    root: './client',
    build: {
      minify: 'terser',
    },
    resolve: {
      alias: {
        'vue/vapor': vaporRuntime,
        '@vue/vapor': vaporRuntime,
      },
    },
    plugins: [
      Vue({
        compiler: CompilerSFC,
        template: {
          compiler: /** @type {any} */ (CompilerVapor),
        },
      }),
    ],
  })
}

function startServer() {
  const server = connect().use(sirv('./client/dist')).listen(PORT)
  console.info(`Server started at http://localhost:${PORT}`)
  return server
}

async function bench() {
  const disableFeatures = [
    'Translate', // avoid translation popups
    'PrivacySandboxSettings4', // avoid privacy popup
    'IPH_SidePanelGenericMenuFeature', // bookmark popup see https://github.com/krausest/js-framework-benchmark/issues/1688
  ]

  const args = [
    '--js-flags=--expose-gc', // needed for gc() function
    '--no-default-browser-check',
    '--disable-sync',
    '--no-first-run',
    '--ash-no-nudges',
    '--disable-extensions',
    `--disable-features=${disableFeatures.join(',')}`,
  ]

  const browser = await launch({
    // headless: false,
    args,
  })
  const page = await browser.newPage()
  await page.goto(`http://localhost:${PORT}/`, {
    waitUntil: 'networkidle0',
  })

  await forceGC()

  const t = performance.now()
  for (let i = 0; i < 50; i++) {
    await doAction('run')
    await doAction('add')
    await doAction('update')
    await doAction('swaprows')
    await doAction('clear')
  }
  console.info('Total time:', performance.now() - t, 'ms')

  const times = await getTimes()
  /** @type {Record<string, { mean: string, std: string }>} */
  const result = {}
  for (const key in times) {
    const mean = getMean(times[key])
    const std = getStandardDeviation(times[key])
    result[key] = { mean: mean.toFixed(2), std: std.toFixed(2) }
  }

  // eslint-disable-next-line no-console
  console.table(result)

  await page.close()
  await browser.close()

  /**
   * @param {string} id
   */
  async function doAction(id) {
    await page.click(`#${id}`)
    await page.waitForSelector('.done')
  }

  function getTimes() {
    return page.evaluate(() => /** @type {any} */ (globalThis).times)
  }

  async function forceGC() {
    await page.evaluate(
      "window.gc({type:'major',execution:'sync',flavor:'last-resort'})",
    )
  }
}

/**
 * @param {number[]} nums
 * @returns {number}
 */
function getMean(nums) {
  return (
    nums.reduce(
      /**
       * @param {number} a
       * @param {number} b
       * @returns {number}
       */
      (a, b) => a + b,
      0,
    ) / nums.length
  )
}

/**
 *
 * @param {number[]} array
 * @returns
 */
function getStandardDeviation(array) {
  const n = array.length
  const mean = array.reduce((a, b) => a + b) / n
  return Math.sqrt(
    array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n,
  )
}
