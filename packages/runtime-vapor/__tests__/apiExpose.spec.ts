import { ref } from '@vue/reactivity'
import { createComponent } from '../src/apiCreateComponent'
import { setRef } from '../src/dom/templateRef'
import { makeRender } from './_utils'

const define = makeRender()
describe('api: expose', () => {
  test('string ref mount (component)', () => {
    const { component: Child } = define({
      setup(_, { expose }) {
        expose({
          foo: 1,
          bar: ref(2),
        })
        return {
          bar: ref(3),
          baz: ref(4),
        }
      },
    })
    const childRef = ref()
    const { render } = define({
      render: () => {
        const n0 = createComponent(Child)
        setRef(n0, childRef)
        return n0
      },
    })

    render()
    expect(childRef.value).toBeTruthy()
    expect(childRef.value.foo).toBe(1)
    expect(childRef.value.bar).toBe(2)
    expect(childRef.value.baz).toBeUndefined()
  })
})
