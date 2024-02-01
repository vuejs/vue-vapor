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
  test.todo('trigger hyphenated events for update:xxx events', () => {})

  test.todo('should trigger array of listeners', async () => {})

  test.todo('warning for undeclared event (array)', () => {})

  test.todo('warning for undeclared event (object)', () => {})

  test.todo('should not warn if has equivalent onXXX prop', () => {})

  test.todo('validator warning', () => {})

  test.todo('merging from mixins', () => {})

  // #2651
  test.todo(
    'should not attach normalized object when mixins do not contain emits',
    () => {},
  )

  test.todo('.once', () => {})

  test.todo('.once with normal listener of the same name', () => {})

  test.todo('.number modifier should work with v-model on component', () => {})

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
