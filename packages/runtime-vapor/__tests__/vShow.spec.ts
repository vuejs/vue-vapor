import { template, children, withDirectives, on, vShow, render } from '../src'
import { ref, defineComponent, nextTick } from 'vue'
import { describe, test, expect } from 'vitest'
import { setupHostElm } from '../../../scripts/setupVitest'

const { getHost } = setupHostElm()
describe('directive: v-show', () => {
  test('basic', async () => {
    const host = getHost()
    const demo = defineComponent({
      setup() {
        const visible = ref(true)
        function handleClick() {
          visible.value = !visible.value
        }
        const t0 = template('<button>toggle</button><h1>hello world</h1>')
        const n0 = t0()
        const {
          0: [n1],
          1: [n2],
        } = children(n0)
        withDirectives(n2, [[vShow, () => visible.value]])
        on(n1 as HTMLElement, 'click', (...args) => handleClick(...args))
        return n0
      },
    })
    render(demo as any, {}, '#host')
    const btn = host.querySelector('button')
    expect(host.innerHTML).toBe('<button>toggle</button><h1>hello world</h1>')
    btn?.click()
    await nextTick()
    expect(host.innerHTML).toBe(
      '<button>toggle</button><h1 style="display: none;">hello world</h1>',
    )
  })
})
