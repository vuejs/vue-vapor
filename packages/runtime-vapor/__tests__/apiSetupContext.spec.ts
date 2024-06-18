import {
  createComponent,
  createSlot,
  createTextNode,
  defineComponent,
  nextTick,
  reactive,
  ref,
  renderEffect,
  setDynamicProps,
  watchEffect,
} from '../src'
import {
  makeRender,
  mountComponent,
  renderToString,
  serializeHTML,
} from './_utils'

import type { Component } from '../src'

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

  it('should update when props change', async () => {
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

    const el = mountComponent(Parent)
    expect(serializeHTML(el.host)).toBe(`0`)

    count.value++
    await nextTick()
    expect(dummy).toBe(1)
    expect(serializeHTML(el.host)).toBe(`1`)
  })

  it('should update when attributes change', async () => {
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

    const el = mountComponent(Parent)
    expect(serializeHTML(el.host)).toMatch(`<div id="foo"></div>`)

    toggle.value = false
    await nextTick()
    expect(serializeHTML(el.host)).toMatch(`<div class="baz"></div>`)
  })

  it('should update when slots content change', async () => {
    const id = ref('foo')

    const Parent = {
      render() {
        return createComponent(Child, null, null, [
          () => ({
            name: 'foo',
            fn: () => createTextNode([id.value]),
          }),
          () => ({
            name: 'bar',
            fn: () => createTextNode(['bar']),
          }),
        ])
      },
    }

    const Child: Component = {
      render() {
        return [createSlot('foo'), createSlot('bar')]
      },
    }

    const el = mountComponent(Parent)
    expect(serializeHTML(el.host)).toMatch(`foobar`)

    id.value = 'baz'
    await nextTick()
    expect(serializeHTML(el.host)).toMatch(`bazbar`)
  })

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
