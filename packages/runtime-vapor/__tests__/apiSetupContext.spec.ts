import {
  createComponent,
  createTextNode,
  defineComponent,
  nextTick,
  reactive,
  ref,
  renderEffect,
  setDynamicProps,
  watchEffect,
} from '../src'
import { makeRender, renderToString } from './_utils'

import type { Component } from '../src'
import { render } from '../src/apiRender'

// import {
//   type TestElement,
//   defineComponent,
//   h,
//   nextTick,
//   nodeOps,
//   render,
//   renderToString,
//   serializeInner,
//   triggerEvent,
//   watchEffect,
// } from '@vue/runtime-test'

// reference: https://vue-composition-api-rfc.netlify.com/api.html#setup

const define = makeRender<any>()

describe('api: setup context', () => {
  it('should expose return values to template render context', () => {
    const Comp: Component = {
      setup() {
        return {
          // ref should auto-unwrap
          ref: ref('foo'),
          // object exposed as-is
          object: reactive({ msg: 'bar' }),
          // primitive value exposed as-is
          value: 'baz',
        }
      },
      render(ctx) {
        return createTextNode([`${ctx.ref} ${ctx.object.msg} ${ctx.value}`])
      },
    }
    expect(renderToString(Comp)).toMatch(`foo bar baz`)
  })

  it('should support returning render function', () => {
    const Comp = {
      setup() {
        return createTextNode([`hello`])
      },
    }
    expect(renderToString(Comp)).toMatch(`hello`)
  })

  it('props', async () => {
    const count = ref(0)
    let dummy

    const Parent: Component = {
      render: () => createComponent(Child, { count: () => count.value }),
    }

    const Child = defineComponent({
      props: { count: Number },
      setup(props) {
        watchEffect(() => {
          dummy = props.count
        })
        return createTextNode(() => [props.count])
      },
    })

    const { host, mount } = define(Parent).create()

    mount()
    expect(host.innerHTML).toBe(`0`)

    // props should be reactive
    count.value++
    await nextTick()
    expect(dummy).toBe(1)
    expect(host.innerHTML).toBe(`1`)
  })

  it('context.attrs', async () => {
    const toggle = ref(true)

    const Parent: Component = {
      render: () =>
        createComponent(Child, () =>
          toggle.value ? { id: 'foo' } : { class: 'baz' },
        ),
    }

    const Child = {
      inheritAttrs: false,
      setup(props: any, { attrs }: any) {
        const el = document.createElement('div')
        renderEffect(() => {
          setDynamicProps(el, attrs)
        })
        return el
      },
    }

    const { mount } = define(Parent).create()

    const root = document.createElement('div')

    mount(root)
    expect(root?.innerHTML).toMatch(`<div id="foo"></div>`)

    toggle.value = false
    await nextTick()
    expect(root?.innerHTML).toMatch(`<div class="baz"></div>`)
  })

  // // #4161
  // it('context.attrs in child component slots', async () => {
  //   const toggle = ref(true)

  //   const Parent = {
  //     render: () => h(Child, toggle.value ? { id: 'foo' } : { class: 'baz' }),
  //   }

  //   const Wrapper = {
  //     render(this: any) {
  //       return this.$slots.default()
  //     },
  //   }

  //   const Child = {
  //     inheritAttrs: false,
  //     setup(_: any, { attrs }: any) {
  //       return () => {
  //         const vnode = h(Wrapper, null, {
  //           default: () => [h('div', attrs)],
  //           _: 1, // mark stable slots
  //         })
  //         vnode.dynamicChildren = [] // force optimized mode
  //         return vnode
  //       }
  //     },
  //   }

  //   const root = nodeOps.createElement('div')
  //   render(h(Parent), root)
  //   expect(serializeInner(root)).toMatch(`<div id="foo"></div>`)

  //   // should update even though it's not reactive
  //   toggle.value = false
  //   await nextTick()
  //   expect(serializeInner(root)).toMatch(`<div class="baz"></div>`)
  // })

  // it('context.slots', async () => {
  //   const id = ref('foo')

  //   const Parent = {
  //     render: () =>
  //       h(Child, null, {
  //         foo: () => id.value,
  //         bar: () => 'bar',
  //       }),
  //   }

  //   const Child = {
  //     setup(props: any, { slots }: any) {
  //       return () => h('div', [...slots.foo(), ...slots.bar()])
  //     },
  //   }

  //   const root = nodeOps.createElement('div')
  //   render(h(Parent), root)
  //   expect(serializeInner(root)).toMatch(`<div>foobar</div>`)

  //   // should update even though it's not reactive
  //   id.value = 'baz'
  //   await nextTick()
  //   expect(serializeInner(root)).toMatch(`<div>bazbar</div>`)
  // })

  // it('context.emit', async () => {
  //   const count = ref(0)
  //   const spy = vi.fn()

  //   const Parent = {
  //     render: () =>
  //       h(Child, {
  //         count: count.value,
  //         onInc: (newVal: number) => {
  //           spy()
  //           count.value = newVal
  //         },
  //       }),
  //   }

  //   const Child = defineComponent({
  //     props: {
  //       count: {
  //         type: Number,
  //         default: 1,
  //       },
  //     },
  //     setup(props, { emit }) {
  //       return () =>
  //         h(
  //           'div',
  //           {
  //             onClick: () => emit('inc', props.count + 1),
  //           },
  //           props.count,
  //         )
  //     },
  //   })

  //   const root = nodeOps.createElement('div')
  //   render(h(Parent), root)
  //   expect(serializeInner(root)).toMatch(`<div>0</div>`)

  //   // emit should trigger parent handler
  //   triggerEvent(root.children[0] as TestElement, 'click')
  //   expect(spy).toHaveBeenCalled()
  //   await nextTick()
  //   expect(serializeInner(root)).toMatch(`<div>1</div>`)
  // })
})
