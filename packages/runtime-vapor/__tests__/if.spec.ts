import { defineComponent } from 'vue'
import {
  append,
  children,
  createIf,
  fragment,
  insert,
  nextTick,
  ref,
  render,
  renderEffect,
  setText,
  template,
} from '../src'
import { NOOP } from '@vue/shared'
import type { Mock } from 'vitest'

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

describe('createIf', () => {
  test('basic', async () => {
    // mock this template:
    //  <div>
    //    <p v-if="counter">{{counter}}</p>
    //    <p v-else>zero</p>
    //  </div>

    let spyIfFn: Mock<any, any>
    let spyElseFn: Mock<any, any>

    let add = NOOP
    let reset = NOOP

    // templates can be reused through caching.
    const t0 = template('<div></div>')
    const t1 = template('<p></p>')
    const t2 = template('<p>zero</p>')

    const component = defineComponent({
      setup() {
        const counter = ref(0)
        add = () => counter.value++
        reset = () => (counter.value = 0)

        // render
        return (() => {
          const n0 = t0()
          const {
            0: [n1],
          } = children(n0)

          insert(
            createIf(
              () => counter.value,
              // v-if
              (spyIfFn ||= vi.fn(() => {
                const n2 = t1()
                const {
                  0: [n3],
                } = children(n2)
                renderEffect(() => {
                  setText(n3, counter.value)
                })
                return n2
              })),
              // v-else
              (spyElseFn ||= vi.fn(() => {
                const n4 = t2()
                return n4
              })),
            ),
            n1,
          )
          return n0
        })()
      },
    })
    render(component as any, {}, '#host')

    expect(host.innerHTML).toBe('<div><p>zero</p><!--if--></div>')
    expect(spyIfFn!).toHaveBeenCalledTimes(0)
    expect(spyElseFn!).toHaveBeenCalledTimes(1)

    add()
    await nextTick()
    expect(host.innerHTML).toBe('<div><p>1</p><!--if--></div>')
    expect(spyIfFn!).toHaveBeenCalledTimes(1)
    expect(spyElseFn!).toHaveBeenCalledTimes(1)

    add()
    await nextTick()
    expect(host.innerHTML).toBe('<div><p>2</p><!--if--></div>')
    expect(spyIfFn!).toHaveBeenCalledTimes(1)
    expect(spyElseFn!).toHaveBeenCalledTimes(1)

    reset()
    await nextTick()
    expect(host.innerHTML).toBe('<div><p>zero</p><!--if--></div>')
    expect(spyIfFn!).toHaveBeenCalledTimes(1)
    expect(spyElseFn!).toHaveBeenCalledTimes(2)
  })

  test('should handle nested template', async () => {
    // mock this template:
    //  <template v-if="ok1">
    //    Hello <template v-if="ok2">Vapor</template>
    //  </template>

    let setOk1: (v: boolean) => void = NOOP
    let setOk2: (v: boolean) => void = NOOP

    const t0 = template('Vapor')
    const t1 = template('Hello ')
    const t2 = fragment()
    render(
      defineComponent({
        setup() {
          const ok1 = ref(true)
          const ok2 = ref(true)
          setOk1 = (newValue: boolean) => (ok1.value = newValue)
          setOk2 = (newValue: boolean) => (ok2.value = newValue)

          // render
          return (() => {
            const n0 = t2()
            append(
              n0,
              createIf(
                () => ok1.value,
                () => {
                  const n2 = t1()
                  append(
                    n2,
                    createIf(
                      () => ok2.value,
                      () => t0(),
                    ),
                  )
                  return n2
                },
              ),
            )
            return n0
          })()
        },
      }) as any,
      {},
      '#host',
    )
    expect(host.innerHTML).toBe('Hello Vapor<!--if--><!--if-->')

    setOk1(false)
    await nextTick()
    expect(host.innerHTML).toBe('<!--if-->')

    setOk1(true)
    await nextTick()
    expect(host.innerHTML).toBe('Hello Vapor<!--if--><!--if-->')

    setOk2(false)
    await nextTick()
    expect(host.innerHTML).toBe('Hello <!--if--><!--if-->')

    setOk1(false)
    await nextTick()
    expect(host.innerHTML).toBe('<!--if-->')
  })
})
