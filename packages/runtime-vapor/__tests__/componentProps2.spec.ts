import { defineComponent } from 'vue'

import type { FunctionalComponent } from '../src/component'
import { getCurrentInstance } from '../src/component'
import { render } from '../src/render'

let host: HTMLElement
const initHost = () => {
  host = document.createElement('div')
  host.setAttribute('id', 'host')
  document.body.appendChild(host)
}
beforeEach(() => initHost())
afterEach(() => host.remove())

describe('component props (vapor)', () => {
  test('stateful', () => {
    let props: any
    // TODO: attrs

    const Comp = defineComponent({
      props: ['fooBar', 'barBaz'],
      render() {
        const instance = getCurrentInstance()!
        props = instance.props
      },
    })

    render(
      Comp as any,
      {
        get fooBar() {
          return 1
        },
      },
      host,
    )
    expect(props.fooBar).toEqual(1)

    // test passing kebab-case and resolving to camelCase
    render(
      Comp as any,
      {
        get ['foo-bar']() {
          return 2
        },
      },
      host,
    )
    expect(props.fooBar).toEqual(2)

    // test updating kebab-case should not delete it (#955)
    render(
      Comp as any,
      {
        get ['foo-bar']() {
          return 3
        },
        get barBaz() {
          return 5
        },
      },
      host,
    )
    expect(props.fooBar).toEqual(3)
    expect(props.barBaz).toEqual(5)

    render(Comp as any, {}, host)
    expect(props.fooBar).toBeUndefined()
    expect(props.barBaz).toBeUndefined()
    // expect(props.qux).toEqual(5) // TODO: attrs
  })

  test('stateful with setup', () => {
    // FIXME: is it necessary?
  })

  test('functional with declaration', () => {
    let props: any
    // TODO: attrs

    const Comp: FunctionalComponent = (_props) => {
      const instance = getCurrentInstance()!
      props = instance.props
      return {}
    }
    Comp.props = ['foo']
    Comp.render = (() => {}) as any

    render(
      Comp as any,
      {
        get foo() {
          return 1
        },
      },
      host,
    )
    expect(props.foo).toEqual(1)

    render(
      Comp as any,
      {
        get foo() {
          return 2
        },
      },
      host,
    )
    expect(props.foo).toEqual(2)

    render(Comp as any, {}, host)
    expect(props.foo).toBeUndefined()
  })

  test('functional without declaration', () => {
    let props: any
    // TODO: attrs

    const Comp: FunctionalComponent = (_props) => {
      const instance = getCurrentInstance()!
      props = instance.props
      return {}
    }
    Comp.props = undefined as any
    Comp.render = (() => {}) as any

    render(
      Comp as any,
      {
        get foo() {
          return 1
        },
      },
      host,
    )
    expect(props.foo).toBeUndefined()

    render(
      Comp as any,
      {
        get foo() {
          return 2
        },
      },
      host,
    )
    expect(props.foo).toBeUndefined()
  })
})
