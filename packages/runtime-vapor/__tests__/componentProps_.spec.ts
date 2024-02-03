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

describe('validator', () => {
  test('validator should be called with two arguments', () => {
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

  // TODO: impl setter and warnner
  test.todo('validator should not be able to mutate other props', async () => {
    const mockFn = vi.fn((...args: any[]) => true)
    const Comp = defineComponent({
      props: {
        foo: {
          type: Number,
          validator: (value: any, props: any) => !!(props.bar = 1),
        },
        bar: {
          type: Number,
          validator: (value: any) => mockFn(value),
        },
      },
      render() {
        const t0 = template('<div/>')
        const n0 = t0()
        return n0
      },
    })

    render(
      Comp,
      {
        get foo() {
          return 1
        },
        get bar() {
          return 2
        },
      },
      host,
    )
    expect(
      `Set operation on key "bar" failed: target is readonly.`,
    ).toHaveBeenWarnedLast()
    expect(mockFn).toHaveBeenCalledWith(2)
  })

  test('warn absent required props', () => {
    const Comp = defineComponent({
      props: {
        bool: { type: Boolean, required: true },
        str: { type: String, required: true },
        num: { type: Number, required: true },
      },
      setup() {
        return () => null
      },
    })
    render(Comp, {}, host)
    expect(`Missing required prop: "bool"`).toHaveBeenWarned()
    expect(`Missing required prop: "str"`).toHaveBeenWarned()
    expect(`Missing required prop: "num"`).toHaveBeenWarned()
  })

  // NOTE: type check is not supported in vapor
  // test('warn on type mismatch', () => {})

  // #3495
  test('should not warn required props using kebab-case', async () => {
    const Comp = defineComponent({
      props: {
        fooBar: { type: String, required: true },
      },
      setup() {
        return () => null
      },
    })

    render(
      Comp,
      {
        get ['foo-bar']() {
          return 'hello'
        },
      },
      host,
    )
    expect(`Missing required prop: "fooBar"`).not.toHaveBeenWarned()
  })
})
