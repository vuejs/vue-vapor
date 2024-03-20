// NOTE: This test is implemented based on the case of `runtime-core/__test__/apiInject.spec.ts`.

import {
  createComponent,
  createTextNode,
  getCurrentInstance,
  inject,
  provide,
  setText,
} from '../src'
import { makeRender } from './_utils'

const define = makeRender<any>()

// reference: https://vue-composition-api-rfc.netlify.com/api.html#provide-inject
describe('api: provide/inject', () => {
  it('string keys', () => {
    const Provider = define({
      setup() {
        provide('foo', 1)
        const instance = getCurrentInstance()!
        return createComponent(Middle, instance, null)
      },
    })

    const Middle = {
      render() {
        const instance = getCurrentInstance()!
        return createComponent(Consumer as any, instance, null)
      },
    }

    const Consumer = {
      setup() {
        return (() => {
          const foo = inject('foo')
          const n0 = createTextNode()
          setText(n0, foo)
          return n0
        })()
      },
    }

    Provider.render()
    expect(Provider.host.innerHTML).toBe('1')
  })

  it('symbol keys', () => {})

  it('default values', () => {})

  it('bound to instance', () => {})

  it('nested providers', () => {})

  it('reactivity with refs', async () => {})

  it('reactivity with readonly refs', async () => {})

  it('reactivity with objects', async () => {})

  it('reactivity with readonly objects', async () => {})

  it('should warn unfound', () => {})

  it('should not warn when default value is undefined', () => {})

  // #2400
  it('should not self-inject', () => {})

  describe('hasInjectionContext', () => {
    it('should be false outside of setup', () => {})

    it('should be true within setup', () => {})

    it('should be true within app.runWithContext()', () => {})
  })
})
