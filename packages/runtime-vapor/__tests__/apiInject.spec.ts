// NOTE: This test is implemented based on the case of `runtime-core/__test__/apiInject.spec.ts`.

import type { Ref } from '@vue/reactivity' // TODO: export Ref from ../src
import {
  type InjectionKey,
  createComponent,
  createTextNode,
  createVaporApp,
  getCurrentInstance,
  hasInjectionContext,
  inject,
  nextTick,
  provide,
  reactive,
  readonly,
  ref,
  renderEffect,
  setText,
} from '../src'
import { makeRender } from './_utils'

const define = makeRender<any>()

// reference: https://vue-composition-api-rfc.netlify.com/api.html#provide-inject
describe('api: provide/inject', () => {
  it('string keys', () => {
    const Provider = define({
      setup() {
        provide('foo', 1)
        return createComponent(Middle, getCurrentInstance()!)
      },
    })

    const Middle = {
      render() {
        return createComponent(Consumer as any, getCurrentInstance()!)
      },
    }

    const Consumer = {
      setup() {
        const foo = inject('foo')
        return (() => {
          const n0 = createTextNode()
          setText(n0, foo)
          return n0
        })()
      },
    }

    Provider.render()
    expect(Provider.host.innerHTML).toBe('1')
  })

  it('symbol keys', () => {
    // also verifies InjectionKey type sync
    const key: InjectionKey<number> = Symbol()

    const Provider = define({
      setup() {
        provide(key, 1)
        const instance = getCurrentInstance()!
        return createComponent(Middle, instance)
      },
    })

    const Middle = {
      render() {
        const instance = getCurrentInstance()!
        return createComponent(Consumer as any, instance)
      },
    }

    const Consumer = {
      setup() {
        const foo = inject(key)
        return (() => {
          const n0 = createTextNode()
          setText(n0, foo)
          return n0
        })()
      },
    }

    Provider.render()
    expect(Provider.host.innerHTML).toBe('1')
  })

  it('default values', () => {
    const Provider = define({
      setup() {
        provide('foo', 'foo')
        const instance = getCurrentInstance()!
        return createComponent(Middle, instance)
      },
    })

    const Middle = {
      render() {
        const instance = getCurrentInstance()!
        return createComponent(Consumer as any, instance)
      },
    }

    const Consumer = {
      setup() {
        // default value should be ignored if value is provided
        const foo = inject('foo', 'fooDefault')
        // default value should be used if value is not provided
        const bar = inject('bar', 'bar')
        return (() => {
          const n0 = createTextNode()
          setText(n0, foo + bar)
          return n0
        })()
      },
    }

    Provider.render()
    expect(Provider.host.innerHTML).toBe('foobar')
  })

  // NOTE: Options API is not supported
  // it('bound to instance', () => {})

  it('nested providers', () => {
    const ProviderOne = define({
      setup() {
        provide('foo', 'foo')
        provide('bar', 'bar')
        return createComponent(ProviderTwo, getCurrentInstance()!)
      },
    })

    const ProviderTwo = {
      setup() {
        // override parent value
        provide('foo', 'fooOverride')
        provide('baz', 'baz')
        return createComponent(Consumer, getCurrentInstance()!)
      },
    }

    const Consumer = {
      setup() {
        const foo = inject('foo')
        const bar = inject('bar')
        const baz = inject('baz')
        return (() => {
          const n0 = createTextNode()
          setText(n0, [foo, bar, baz].join(','))
          return n0
        })()
      },
    }

    ProviderOne.render()
    expect(ProviderOne.host.innerHTML).toBe('fooOverride,bar,baz')
  })

  it('reactivity with refs', async () => {
    const count = ref(1)

    const Provider = define({
      setup() {
        provide('count', count)
        return createComponent(Middle, getCurrentInstance()!)
      },
    })

    const Middle = {
      render: () => createComponent(Consumer, getCurrentInstance()!),
    }

    const Consumer = {
      setup() {
        const count = inject<Ref<number>>('count')!
        return (() => {
          const n0 = createTextNode()
          renderEffect(() => {
            setText(n0, count.value)
          })
          return n0
        })()
      },
    }

    Provider.render()
    expect(Provider.host.innerHTML).toBe('1')

    count.value++
    await nextTick()
    expect(Provider.host.innerHTML).toBe('2')
  })

  it('reactivity with readonly refs', async () => {
    const count = ref(1)

    const Provider = define({
      setup() {
        provide('count', readonly(count))
        return createComponent(Middle, getCurrentInstance()!)
      },
    })

    const Middle = {
      render: () => createComponent(Consumer, getCurrentInstance()!),
    }

    const Consumer = {
      setup() {
        const count = inject<Ref<number>>('count')!
        // should not work
        count.value++
        return (() => {
          const n0 = createTextNode()
          renderEffect(() => {
            setText(n0, count.value)
          })
          return n0
        })()
      },
    }

    Provider.render()
    expect(Provider.host.innerHTML).toBe('1')

    expect(
      `Set operation on key "value" failed: target is readonly`,
    ).toHaveBeenWarned()

    count.value++
    await nextTick()
    expect(Provider.host.innerHTML).toBe('2')
  })

  it('reactivity with objects', async () => {
    const rootState = reactive({ count: 1 })

    const Provider = define({
      setup() {
        provide('state', rootState)
        return createComponent(Middle, getCurrentInstance()!)
      },
    })

    const Middle = {
      render: () => createComponent(Consumer, getCurrentInstance()!),
    }

    const Consumer = {
      setup() {
        const state = inject<typeof rootState>('state')!
        return (() => {
          const n0 = createTextNode()
          renderEffect(() => {
            setText(n0, state.count)
          })
          return n0
        })()
      },
    }

    Provider.render()
    expect(Provider.host.innerHTML).toBe('1')

    rootState.count++
    await nextTick()
    expect(Provider.host.innerHTML).toBe('2')
  })

  it('reactivity with readonly objects', async () => {
    const rootState = reactive({ count: 1 })

    const Provider = define({
      setup() {
        provide('state', readonly(rootState))
        return createComponent(Middle, getCurrentInstance()!)
      },
    })

    const Middle = {
      render: () => createComponent(Consumer, getCurrentInstance()!),
    }

    const Consumer = {
      setup() {
        const state = inject<typeof rootState>('state')!
        // should not work
        state.count++
        return (() => {
          const n0 = createTextNode()
          renderEffect(() => {
            setText(n0, state.count)
          })
          return n0
        })()
      },
    }

    Provider.render()
    expect(Provider.host.innerHTML).toBe('1')

    expect(
      `Set operation on key "count" failed: target is readonly`,
    ).toHaveBeenWarned()

    rootState.count++
    await nextTick()
    expect(Provider.host.innerHTML).toBe('2')
  })

  it('should warn unfound', () => {
    const Provider = define({
      setup() {
        return createComponent(Middle, getCurrentInstance()!)
      },
    })

    const Middle = {
      render: () => createComponent(Consumer, getCurrentInstance()!),
    }

    const Consumer = {
      setup() {
        const foo = inject('foo')
        expect(foo).toBeUndefined()
        return (() => {
          const n0 = createTextNode()
          setText(n0, foo)
          return n0
        })()
      },
    }

    Provider.render()
    expect(Provider.host.innerHTML).toBe('')
    expect(`injection "foo" not found.`).toHaveBeenWarned()
  })

  it('should not warn when default value is undefined', () => {
    const Provider = define({
      setup() {
        return createComponent(Middle, getCurrentInstance()!)
      },
    })

    const Middle = {
      render: () => createComponent(Consumer, getCurrentInstance()!),
    }

    const Consumer = {
      setup() {
        const foo = inject('foo', undefined)
        return (() => {
          const n0 = createTextNode()
          setText(n0, foo)
          return n0
        })()
      },
    }

    Provider.render()
    expect(`injection "foo" not found.`).not.toHaveBeenWarned()
  })

  // #2400
  it.todo('should not self-inject', () => {
    const Comp = define({
      setup() {
        provide('foo', 'foo')
        const injection = inject('foo', null)
        return () => injection
      },
    })

    Comp.render()
    expect(Comp.host.innerHTML).toBe('')
  })

  describe('hasInjectionContext', () => {
    it('should be false outside of setup', () => {
      expect(hasInjectionContext()).toBe(false)
    })

    it('should be true within setup', () => {
      expect.assertions(1)
      const Comp = define({
        setup() {
          expect(hasInjectionContext()).toBe(true)
          return () => null
        },
      })

      Comp.render()
    })

    it('should be true within app.runWithContext()', () => {
      expect.assertions(1)
      createVaporApp({}).runWithContext(() => {
        expect(hasInjectionContext()).toBe(true)
      })
    })
  })
})
