import {
  template,
  children,
  effect,
  setText,
  render,
  getCurrentInstance,
  ref,
  unmountComponent,
} from '../src'
import type { ComponentInternalInstance } from '../src'
import { afterEach, beforeEach, describe, expect } from 'vitest'
import { defineComponent, nextTick } from '@vue/runtime-core'

let host: HTMLElement

const initHost = () => {
  host = document.createElement('div')
  host.setAttribute('id', 'host')
  document.body.appendChild(host)
}
beforeEach(() => {
  initHost()
})
afterEach(() => {
  host.remove()
})
describe('component', () => {
  test('unmountComponent', async () => {
    let _instance: ComponentInternalInstance | null = null
    const Comp = defineComponent({
      __name: 'directive',
      setup() {
        _instance = getCurrentInstance()
        const count = ref(0)
        const __returned__ = { count }
        Object.defineProperty(__returned__, '__isScriptSetup', {
          enumerable: false,
          value: true,
        })
        return __returned__
      },
      render(ctx: any) {
        const t0 = template('<div></div>')
        const n0 = t0()
        const {
          0: [n1],
        } = children(n0 as ChildNode)
        effect(() => {
          setText(n1 as Element, void 0, ctx.count)
        })
        return n0
      },
    })
    render(Comp as any, {}, '#host')
    await nextTick()
    expect(host.innerHTML).toBe('<div>0</div>')
    unmountComponent(_instance!)
    expect(host.innerHTML).toBe('')
  })
})
