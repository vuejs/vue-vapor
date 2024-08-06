// @ts-check
import path from 'node:path'
import { parseArgs } from 'node:util'
import { writeFile } from 'node:fs/promises'
import Vue from '@vitejs/plugin-vue'
import { build } from 'vite'
import connect from 'connect'
import sirv from 'sirv'
import { launch } from 'puppeteer'
import colors from 'picocolors'
import { exec } from '../scripts/utils.js'

// Thanks to https://github.com/krausest/js-framework-benchmark (Apache-2.0 license)

const {
  values: {
    skipVapor,
    skipApp,
    skipBench,
    port: portStr,
    count: countStr,
    'no-headless': noHeadless,
  },
} = parseArgs({
  allowNegative: true,
  allowPositionals: true,
  options: {
    skipVapor: {
      type: 'boolean',
      short: 'v',
    },
    skipApp: {
      type: 'boolean',
      short: 'a',
    },
    skipBench: {
      type: 'boolean',
      short: 'a',
    },
    port: {
      type: 'string',
      short: 'p',
      default: '8193',
    },
    count: {
      type: 'string',
      short: 'c',
      default: '50',
    },
    'no-headless': {
      type: 'boolean',
    },
  },
})

const port = +(/** @type {string}*/ (portStr))
const count = +(/** @type {string}*/ (countStr))

if (!skipVapor) {
  await buildVapor()
}
if (!skipApp) {
  await buildApp()
}
const server = startServer()

if (!skipBench) {
  await bench()
  server.close()
}

async function buildVapor() {
  console.info(colors.blue('Building Vapor...'))

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
  console.info(colors.blue('\nBuilding app...\n'))

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
      rollupOptions: {
        onwarn(log, handler) {
          if (log.code === 'INVALID_ANNOTATION') return
          handler(log)
        },
      },
    },
    resolve: {
      alias: {
        'vue/vapor': vaporRuntime,
        '@vue/vapor': vaporRuntime,
      },
    },
    clearScreen: false,
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
  const server = connect().use(sirv('./client/dist')).listen(port)
  console.info(`\n\nServer started at`, colors.blue(`http://localhost:${port}`))
  process.on('SIGTERM', () => server.close())
  return server
}

async function bench() {
  console.info(colors.blue('\nStarting benchmark...'))
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

  const headless = !noHeadless
  console.info('headless:', headless)
  const browser = await launch({
    headless: headless,
    args,
  })
  console.log('browser version:', colors.blue(await browser.version()))
  const page = await browser.newPage()
  await page.goto(`http://localhost:${port}/`, {
    waitUntil: 'networkidle0',
  })

  await forceGC()

  const t = performance.now()
  for (let i = 0; i < count; i++) {
    await clickButton('run')
    await clickButton('add')
    await select()
    await clickButton('update')
    await clickButton('swaprows')
    await clickButton('runLots')
    await clickButton('clear')
  }
  console.info('Total time:', ((performance.now() - t) / 1000).toFixed(2), 's')

  const times = await getTimes()

  /** @type {Record<string, { mean: number, std: number }>} */
  const result = Object.fromEntries(
    Object.entries(times).map(([k, v]) => [k, compute(v)]),
  )
  console.table(result)
  writeFile('benchmark-result.json', JSON.stringify(result))

  await browser.close()

  /**
   * @param {string} id
   */
  async function clickButton(id) {
    await page.click(`#${id}`)
    await wait()
  }

  async function select() {
    for (let i = 1; i <= 10; i++) {
      await page.click(`tbody > tr:nth-child(2) > td:nth-child(2) > a`)
      await page.waitForSelector(`tbody > tr:nth-child(2).danger`)
      await page.click(`tbody > tr:nth-child(2) > td:nth-child(3) > button`)
      await wait()
    }
  }

  async function wait() {
    await page.waitForSelector('.done')
  }

  function getTimes() {
    return page.evaluate(() => /** @type {any} */ (globalThis).times)
  }

  async function forceGC() {
    await page.evaluate(
      `window.gc({type:'major',execution:'sync',flavor:'last-resort'})`,
    )
  }
}

/**
 * @param {number[]} array
 */
function compute(array) {
  const n = array.length
  const max = Math.max(...array)
  const min = Math.min(...array)
  const mean = array.reduce((a, b) => a + b) / n
  const std = Math.sqrt(
    array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n,
  )
  const median = array.slice().sort((a, b) => a - b)[Math.floor(n / 2)]
  return {
    max: round(max),
    min: round(min),
    mean: round(mean),
    std: round(std),
    median: round(median),
  }
}

/**
 * @param {number} n
 */
function round(n) {
  return +n.toFixed(2)
}
