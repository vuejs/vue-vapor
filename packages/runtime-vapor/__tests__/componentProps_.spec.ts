// NOTE: merge into `componentProps.spec.ts` (https://github.com/vuejs/core-vapor/pull/99)

import { defineComponent, render, template } from '../src'

let host: HTMLElement
const initHost = () => {
  host = document.createElement('div')
  host.setAttribute('id', 'host')
  document.body.appendChild(host)
}
beforeEach(() => initHost())
afterEach(() => host.remove())

describe('component props (vapor)', () => {
  test('validator', () => {
    let args: any
    const mockFn = vi.fn((..._args: any[]) => {
      args = _args
      return true
    })

    const Comp = defineComponent({
      props: {
        foo: {
          type: Number,
          validator: (value: any, props: any) => mockFn(value, props),
        },
        bar: {
          type: Number,
        },
      },
      render() {
        const t0 = template('<div/>')
        const n0 = t0()
        return n0
      },
    })

    const props = {
      get foo() {
        return 1
      },
      get bar() {
        return 2
      },
    }

    render(Comp, props, host)
    expect(mockFn).toHaveBeenCalled()
    // NOTE: Vapor Component props defined by getter. So, `props` not Equal to `{ foo: 1, bar: 2 }`
    // expect(mockFn).toHaveBeenCalledWith(1, { foo: 1, bar: 2 })
    expect(args.length).toBe(2)
    expect(args[0]).toBe(1)
    expect(args[1].foo).toEqual(1)
    expect(args[1].bar).toEqual(2)
  })
})
