import { createComponent, ref, setRef, template } from '../../src'
import { makeRender } from '../_utils'

const define = makeRender()

describe('api: template ref', () => {
  test('ref on element', () => {
    const t0 = template('<div ref="foo">hello</div>')
    const { render } = define({
      setup() {
        return {
          foo: ref(null),
        }
      },
      render() {
        const n0 = t0()
        setRef(n0 as any, 'foo')
        return n0
      },
    })

    const { host, instance } = render()
    expect(instance.refs.foo).toBe(host.firstChild)
  })

  test('ref on component', () => {
    const exposeRef = ref<Record<string, string> | undefined>()
    const { component: Child } = define({
      setup(_, { expose }) {
        expose(exposeRef.value)
      },
    })
    const compRef = ref()
    const { render } = define({
      setup() {
        return {
          compRef,
        }
      },
      render: () => {
        const n0 = createComponent(Child)
        setRef(n0, 'compRef')
        return n0
      },
    })

    expect(render().instance.refs.compRef).toBeDefined()

    const exposeValue = { foo: 'bar' }
    exposeRef.value = exposeValue

    expect(render().instance.refs.compRef).toEqual(exposeValue)
  })
})
