// NOTE: this test cases are based on paclages/runtime-core/__tests__/componentEmits.spec.ts

// Note: emits and listener fallthrough is tested in
// ./rendererAttrsFallthrough.spec.ts.

import { defineComponent, render } from '../src'

let host: HTMLElement

const initHost = () => {
  host = document.createElement('div')
  host.setAttribute('id', 'host')
  document.body.appendChild(host)
}
beforeEach(() => initHost())
afterEach(() => host.remove())

describe('component: emit', () => {
  test('trigger handlers', () => {
    const Foo = defineComponent({
      render() {},
      setup(_: any, { emit }: any) {
        emit('foo')
        emit('bar')
        emit('!baz')
      },
    })
    const onfoo = vi.fn()
    const onBar = vi.fn()
    const onBaz = vi.fn()
    render(
      Foo,
      {
        get onfoo() {
          return onfoo
        },
        get onBar() {
          return onBar
        },
        get ['on!baz']() {
          return onBaz
        },
      },
      '#host',
    )

    expect(onfoo).not.toHaveBeenCalled()
    expect(onBar).toHaveBeenCalled()
    expect(onBaz).toHaveBeenCalled()
  })

  test('trigger camelCase handler', () => {
    const Foo = defineComponent({
      render() {},
      setup(_: any, { emit }: any) {
        emit('test-event')
      },
    })

    const fooSpy = vi.fn()
    render(
      Foo,
      {
        get onTestEvent() {
          return fooSpy
        },
      },
      '#host',
    )
    expect(fooSpy).toHaveBeenCalled()
  })

  test('trigger kebab-case handler', () => {
    const Foo = defineComponent({
      render() {},
      setup(_: any, { emit }: any) {
        emit('test-event')
      },
    })

    const fooSpy = vi.fn()
    render(
      Foo,
      {
        get ['onTest-event']() {
          return fooSpy
        },
      },
      '#host',
    )
    expect(fooSpy).toHaveBeenCalledTimes(1)
  })

  // #3527
  test.todo('trigger mixed case handlers', () => {
    const Foo = defineComponent({
      render() {},
      setup(_: any, { emit }: any) {
        emit('test-event')
        emit('testEvent')
      },
    })

    const fooSpy = vi.fn()
    const barSpy = vi.fn()
    render(
      Foo,
      // TODO: impl `toHandlers`
      {
        get ['onTest-Event']() {
          return fooSpy
        },
        get onTestEvent() {
          return barSpy
        },
      },
      '#host',
    )
    expect(fooSpy).toHaveBeenCalledTimes(1)
    expect(barSpy).toHaveBeenCalledTimes(1)
  })

  // for v-model:foo-bar usage in DOM templates
  test('trigger hyphenated events for update:xxx events', () => {
    const Foo = defineComponent({
      render() {},
      setup(_: any, { emit }: any) {
        emit('update:fooProp')
        emit('update:barProp')
      },
    })

    const fooSpy = vi.fn()
    const barSpy = vi.fn()
    render(
      Foo,
      {
        get ['onUpdate:fooProp']() {
          return fooSpy
        },
        get ['onUpdate:bar-prop']() {
          return barSpy
        },
      },
      '#host',
    )

    expect(fooSpy).toHaveBeenCalled()
    expect(barSpy).toHaveBeenCalled()
  })

  test('should trigger array of listeners', async () => {
    const App = defineComponent({
      render() {},
      setup(_: any, { emit }: any) {
        emit('foo', 1)
      },
    })

    const fn1 = vi.fn()
    const fn2 = vi.fn()

    render(
      App,
      {
        get onFoo() {
          return [fn1, fn2]
        },
      },
      '#host',
    )
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn1).toHaveBeenCalledWith(1)
    expect(fn2).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledWith(1)
  })

  test.todo('warning for undeclared event (array)', () => {})

  test.todo('warning for undeclared event (object)', () => {})

  test('should not warn if has equivalent onXXX prop', () => {
    const Foo = defineComponent({
      props: ['onFoo'],
      emits: [],
      render() {},
      setup(_: any, { emit }: any) {
        emit('foo')
      },
    })
    render(Foo, {}, '#host')
    expect(
      `Component emitted event "foo" but it is neither declared`,
    ).not.toHaveBeenWarned()
  })

  test.todo('validator warning', () => {})

  // NOTE: not supported mixins
  // test.todo('merging from mixins', () => {})

  // #2651
  // test.todo(
  //   'should not attach normalized object when mixins do not contain emits',
  //   () => {},
  // )

  test('.once', () => {
    const Foo = defineComponent({
      render() {},
      emits: {
        foo: null,
        bar: null,
      },
      setup(_: any, { emit }: any) {
        emit('foo')
        emit('foo')
        emit('bar')
        emit('bar')
      },
    })
    const fn = vi.fn()
    const barFn = vi.fn()
    render(
      Foo,
      {
        get onFooOnce() {
          return fn
        },
        get onBarOnce() {
          return barFn
        },
      },
      '#host',
    )
    expect(fn).toHaveBeenCalledTimes(1)
    expect(barFn).toHaveBeenCalledTimes(1)
  })

  test('.once with normal listener of the same name', () => {
    const Foo = defineComponent({
      render() {},
      emits: {
        foo: null,
      },
      setup(_: any, { emit }: any) {
        emit('foo')
        emit('foo')
      },
    })
    const onFoo = vi.fn()
    const onFooOnce = vi.fn()
    render(
      Foo,
      {
        get onFoo() {
          return onFoo
        },
        get onFooOnce() {
          return onFooOnce
        },
      },
      '#host',
    )
    expect(onFoo).toHaveBeenCalledTimes(2)
    expect(onFooOnce).toHaveBeenCalledTimes(1)
  })

  test('.number modifier should work with v-model on component', () => {
    const Foo = defineComponent({
      render() {},
      setup(_: any, { emit }: any) {
        emit('update:modelValue', '1')
        emit('update:foo', '2')
      },
    })
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    render(
      Foo,
      {
        get modelValue() {
          return null
        },
        get modelModifiers() {
          return { number: true }
        },
        get ['onUpdate:modelValue']() {
          return fn1
        },
        get foo() {
          return null
        },
        get fooModifiers() {
          return { number: true }
        },
        get ['onUpdate:foo']() {
          return fn2
        },
      },
      '#host',
    )
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn1).toHaveBeenCalledWith(1)
    expect(fn2).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledWith(2)
  })

  test.todo('.trim modifier should work with v-model on component', () => {})

  test.todo(
    '.trim and .number modifiers should work with v-model on component',
    () => {},
  )

  test.todo(
    'only trim string parameter when work with v-model on component',
    () => {},
  )

  test.todo('isEmitListener', () => {})

  test.todo('does not emit after unmount', async () => {})

  test.todo('merge string array emits', async () => {})

  test.todo('merge object emits', async () => {})
})
