import type { NodeRef } from 'packages/runtime-vapor/src/dom/templateRef'
import {
  createIf,
  nextTick,
  ref,
  renderEffect,
  setRef,
  template,
} from '../../src'
import { makeRender } from '../_utils'

const define = makeRender()

describe('api: template ref', () => {
  test('string ref mount', () => {
    const t0 = template('<div ref="refKey"></div>')
    const el = ref(null)
    const { render } = define({
      setup() {
        return {
          refKey: el,
        }
      },
      render() {
        const n0 = t0()
        setRef(n0 as Element, 'refKey')
        return n0
      },
    })

    const { host } = render()
    expect(el.value).toBe(host.children[0])
  })

  it('string ref update', async () => {
    const t0 = template('<div></div>')
    const fooEl = ref(null)
    const barEl = ref(null)
    const refKey = ref('foo')

    const { render } = define({
      setup() {
        return {
          foo: fooEl,
          bar: barEl,
        }
      },
      render() {
        const n0 = t0()
        let r0: NodeRef | undefined
        renderEffect(() => {
          r0 = setRef(n0 as Element, refKey.value, r0)
        })
        return n0
      },
    })
    const { host } = render()
    expect(fooEl.value).toBe(host.children[0])
    expect(barEl.value).toBe(null)

    refKey.value = 'bar'
    await nextTick()
    expect(barEl.value).toBe(host.children[0])
    expect(fooEl.value).toBe(null)
  })

  it('string ref unmount', async () => {
    const t0 = template('<div></div>')
    const el = ref(null)
    const toggle = ref(true)

    const { render } = define({
      setup() {
        return {
          refKey: el,
        }
      },
      render() {
        const n0 = createIf(
          () => toggle.value,
          () => {
            const n1 = t0()
            setRef(n1 as Element, 'refKey')
            return n1
          },
        )
        return n0
      },
    })
    const { host } = render()
    expect(el.value).toBe(host.children[0])

    toggle.value = false
    await nextTick()
    expect(el.value).toBe(null)
  })
})
