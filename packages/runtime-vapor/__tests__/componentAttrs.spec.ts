import {
  createComponent,
  defineComponent,
  getCurrentInstance,
  nextTick,
  ref,
  setText,
  template,
  toRefs,
  watch,
  watchEffect,
} from '../src'
import { setCurrentInstance } from '../src/component'
import { makeRender } from './_utils'

const define = makeRender<any>()

describe('attribute fallthrough', () => {
  it('should allow attrs to fallthrough', async () => {
    const t0 = template('<div>')
    const { component: Child } = define({
      props: ['foo'],
      render() {
        const instance = getCurrentInstance()!
        const n0 = t0()
        watchEffect(() => setText(n0, instance.props.foo))
        return n0
      },
    })

    const foo = ref(1)
    const id = ref('a')
    const { instance, host } = define({
      setup() {
        return { foo, id }
      },
      render(_ctx: Record<string, any>) {
        return createComponent(Child, {
          foo: () => _ctx.foo,
          id: () => _ctx.id,
        })
      },
    }).render()
    const reset = setCurrentInstance(instance)
    expect(host.innerHTML).toBe('<div id="a">1</div>')

    foo.value++
    await nextTick()
    expect(host.innerHTML).toBe('<div id="a">2</div>')

    id.value = 'b'
    await nextTick()
    expect(host.innerHTML).toBe('<div id="b">2</div>')
    reset()
  })
})
