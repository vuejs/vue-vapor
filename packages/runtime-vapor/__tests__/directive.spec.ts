import {
  template,
  children,
  withDirectives,
  effect,
  setText,
  render,
  getCurrentInstance,
  on,
  ref,
  unmountComponent
} from '../src'
import type { DirectiveBinding, DirectiveHook, ComponentInternalInstance } from '../src'
import {afterEach, beforeEach, describe, expect} from "vitest";
import { defineComponent, nextTick } from "@vue/runtime-core";

let host: HTMLElement

const initHost = () => {
  host = document.createElement('div')
  host.setAttribute('id', 'host')
  document.body.appendChild(host)
}
beforeEach(() => {
  initHost()
})
afterEach(() => {
  host.remove()
})

describe('directives', () => {
  it('should work', async () => {
    const count = ref(0);
    function assertBindings(binding: DirectiveBinding) {
      expect(binding.value).toBe(count.value)
      expect(binding.arg).toBe('foo')
      expect(binding.instance).toBe(_instance)
      expect(binding.modifiers && binding.modifiers.ok).toBe(true)
    }

    const beforeMount = vi.fn(((el, binding) => {
      expect(el.tagName).toBe('DIV')
      // should not be inserted yet
      expect(el.parentElement).toBe(null)
      expect(host.children.length).toBe(0)

      assertBindings(binding)
    }) as DirectiveHook)

    const mounted = vi.fn(((el, binding) => {
      expect(el.tagName).toBe('DIV')
      // should be inserted now
      expect(el.parentNode).toBe(host)
      expect(host.children[0]).toBe(el)

      assertBindings(binding)
    }) as DirectiveHook)

    // TODO: beforeUpdate hook unit test
    /*const beforeUpdate = vi.fn(((el, binding, vnode, prevVNode) => {
      expect(el.tag).toBe('div')
      expect(el.parentNode).toBe(root)
      expect(root.children[0]).toBe(el)

      // node should not have been updated yet
      expect(el.children[0].text).toBe(`${count.value - 1}`)

      assertBindings(binding)

      expect(vnode).toBe(_vnode)
      expect(prevVNode).toBe(_prevVnode)
    }) as DirectiveHook)*/

    const updated = vi.fn(((el, binding) => {
      expect(el.tagName).toBe('DIV')
      expect(el.parentElement).toBe(host)
      expect(host.children[0]).toBe(el)
      // node should have been updated
      expect(el.innerHTML).toBe(`${count.value}`)

      assertBindings(binding)
    }) as DirectiveHook)

    const beforeUnmount = vi.fn(((el, binding) => {
      expect(el.tagName).toBe('DIV')
      // should be removed now
      expect(el.parentElement).toBe(host)
      expect(host.children[0]).toBe(el)

      assertBindings(binding)
    }) as DirectiveHook)

    const unmounted = vi.fn(((el, binding) => {
      expect(el.tagName).toBe('DIV')
      // should have been removed
      expect(el.parentElement).toBe(null)
      expect(host.children.length).toBe(0)

      assertBindings(binding)
    }) as DirectiveHook)

    const dir = {
      beforeMount,
      mounted,
      // beforeUpdate
      updated,
      beforeUnmount,
      unmounted
    }

    let _instance: ComponentInternalInstance | null = null
    const Comp = defineComponent({
      setup(){
        _instance = getCurrentInstance()
        const __returned__ = { count, dir };
        Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
        return __returned__;
      },
      render(ctx: any){
        const t0 = template("<div id=\"foo\"></div>");
        const n0 = t0();
        const { 0: [n1] } = children(n0 as ChildNode);
        withDirectives(n1, [[ctx.dir, () => ctx.count, "foo", { ok: true }]]);
        effect(() => {
          setText(n1 as Element, void 0, ctx.count);
        });
        return n0;
      }
    })

    render(Comp as any, {}, '#host')
    await nextTick()
    expect(beforeMount).toHaveBeenCalledTimes(1)
    expect(mounted).toHaveBeenCalledTimes(1)

    count.value++
    await nextTick()
    expect(updated).toHaveBeenCalledTimes(1)

    debugger
    unmountComponent(_instance!)
    // render(null, root)
    expect(beforeUnmount).toHaveBeenCalledTimes(1)
    // expect(unmounted).toHaveBeenCalledTimes(1)
  })

/*  it('should work with a function directive', async () => {
    const count = ref(0)

    function assertBindings(binding: DirectiveBinding) {
      expect(binding.value).toBe(count.value)
      expect(binding.arg).toBe('foo')
      expect(binding.instance).toBe(_instance && _instance.proxy)
      expect(binding.modifiers && binding.modifiers.ok).toBe(true)
    }

    const fn = vi.fn(((el, binding, vnode, prevVNode) => {
      expect(el.tag).toBe('div')
      expect(el.parentNode).toBe(root)

      assertBindings(binding)

      expect(vnode).toBe(_vnode)
      expect(prevVNode).toBe(_prevVnode)
    }) as DirectiveHook)

    let _instance: ComponentInternalInstance | null = null
    let _vnode: VNode | null = null
    let _prevVnode: VNode | null = null
    const Comp = {
      setup() {
        _instance = currentInstance
      },
      render() {
        _prevVnode = _vnode
        _vnode = withDirectives(h('div', count.value), [
          [
            fn,
            // value
            count.value,
            // argument
            'foo',
            // modifiers
            { ok: true }
          ]
        ])
        return _vnode
      }
    }

    const root = nodeOps.createElement('div')
    render(h(Comp), root)

    expect(fn).toHaveBeenCalledTimes(1)

    count.value++
    await nextTick()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should work on component vnode', async () => {
    const count = ref(0)

    function assertBindings(binding: DirectiveBinding) {
      expect(binding.value).toBe(count.value)
      expect(binding.arg).toBe('foo')
      expect(binding.instance).toBe(_instance && _instance.proxy)
      expect(binding.modifiers && binding.modifiers.ok).toBe(true)
    }

    const beforeMount = vi.fn(((el, binding, vnode, prevVNode) => {
      expect(el.tag).toBe('div')
      // should not be inserted yet
      expect(el.parentNode).toBe(null)
      expect(root.children.length).toBe(0)

      assertBindings(binding)

      expect(vnode.type).toBe(_vnode!.type)
      expect(prevVNode).toBe(null)
    }) as DirectiveHook)

    const mounted = vi.fn(((el, binding, vnode, prevVNode) => {
      expect(el.tag).toBe('div')
      // should be inserted now
      expect(el.parentNode).toBe(root)
      expect(root.children[0]).toBe(el)

      assertBindings(binding)

      expect(vnode.type).toBe(_vnode!.type)
      expect(prevVNode).toBe(null)
    }) as DirectiveHook)

    const beforeUpdate = vi.fn(((el, binding, vnode, prevVNode) => {
      expect(el.tag).toBe('div')
      expect(el.parentNode).toBe(root)
      expect(root.children[0]).toBe(el)

      // node should not have been updated yet
      expect(el.children[0].text).toBe(`${count.value - 1}`)

      assertBindings(binding)

      expect(vnode.type).toBe(_vnode!.type)
      expect(prevVNode!.type).toBe(_prevVnode!.type)
    }) as DirectiveHook)

    const updated = vi.fn(((el, binding, vnode, prevVNode) => {
      expect(el.tag).toBe('div')
      expect(el.parentNode).toBe(root)
      expect(root.children[0]).toBe(el)

      // node should have been updated
      expect(el.children[0].text).toBe(`${count.value}`)

      assertBindings(binding)

      expect(vnode.type).toBe(_vnode!.type)
      expect(prevVNode!.type).toBe(_prevVnode!.type)
    }) as DirectiveHook)

    const beforeUnmount = vi.fn(((el, binding, vnode, prevVNode) => {
      expect(el.tag).toBe('div')
      // should be removed now
      expect(el.parentNode).toBe(root)
      expect(root.children[0]).toBe(el)

      assertBindings(binding)

      expect(vnode.type).toBe(_vnode!.type)
      expect(prevVNode).toBe(null)
    }) as DirectiveHook)

    const unmounted = vi.fn(((el, binding, vnode, prevVNode) => {
      expect(el.tag).toBe('div')
      // should have been removed
      expect(el.parentNode).toBe(null)
      expect(root.children.length).toBe(0)

      assertBindings(binding)

      expect(vnode.type).toBe(_vnode!.type)
      expect(prevVNode).toBe(null)
    }) as DirectiveHook)

    const dir = {
      beforeMount,
      mounted,
      beforeUpdate,
      updated,
      beforeUnmount,
      unmounted
    }

    let _instance: ComponentInternalInstance | null = null
    let _vnode: VNode | null = null
    let _prevVnode: VNode | null = null

    const Child = (props: { count: number }) => {
      _prevVnode = _vnode
      _vnode = h('div', props.count)
      return _vnode
    }

    const Comp = {
      setup() {
        _instance = currentInstance
      },
      render() {
        return withDirectives(h(Child, { count: count.value }), [
          [
            dir,
            // value
            count.value,
            // argument
            'foo',
            // modifiers
            { ok: true }
          ]
        ])
      }
    }

    const root = nodeOps.createElement('div')
    render(h(Comp), root)

    expect(beforeMount).toHaveBeenCalledTimes(1)
    expect(mounted).toHaveBeenCalledTimes(1)

    count.value++
    await nextTick()
    expect(beforeUpdate).toHaveBeenCalledTimes(1)
    expect(updated).toHaveBeenCalledTimes(1)

    render(null, root)
    expect(beforeUnmount).toHaveBeenCalledTimes(1)
    expect(unmounted).toHaveBeenCalledTimes(1)
  })

  // #2298
  it('directive merging on component root', () => {
    const d1 = {
      mounted: vi.fn()
    }
    const d2 = {
      mounted: vi.fn()
    }
    const Comp = {
      render() {
        return withDirectives(h('div'), [[d2]])
      }
    }

    const App = {
      name: 'App',
      render() {
        return h('div', [withDirectives(h(Comp), [[d1]])])
      }
    }

    const root = nodeOps.createElement('div')
    render(h(App), root)
    expect(d1.mounted).toHaveBeenCalled()
    expect(d2.mounted).toHaveBeenCalled()
  })

  test('should disable tracking inside directive lifecycle hooks', async () => {
    const count = ref(0)
    const text = ref('')
    const beforeUpdate = vi.fn(() => count.value++)

    const App = {
      render() {
        return withDirectives(h('p', text.value), [
          [
            {
              beforeUpdate
            }
          ]
        ])
      }
    }

    const root = nodeOps.createElement('div')
    render(h(App), root)
    expect(beforeUpdate).toHaveBeenCalledTimes(0)
    expect(count.value).toBe(0)

    text.value = 'foo'
    await nextTick()
    expect(beforeUpdate).toHaveBeenCalledTimes(1)
    expect(count.value).toBe(1)
  })

  test('should receive exposeProxy for closed instances', async () => {
    let res: string
    const App = defineComponent({
      setup(_, { expose }) {
        expose({
          msg: 'Test'
        })

        return () =>
          withDirectives(h('p', 'Lore Ipsum'), [
            [
              {
                mounted(el, { instance }) {
                  res = (instance as any).msg as string
                }
              }
            ]
          ])
      }
    })
    const root = nodeOps.createElement('div')
    render(h(App), root)
    expect(res!).toBe('Test')
  })

  test('should not throw with unknown directive', async () => {
    const d1 = {
      mounted: vi.fn()
    }
    const App = {
      name: 'App',
      render() {
        // simulates the code generated on an unknown directive
        return withDirectives(h('div'), [[undefined], [d1]])
      }
    }

    const root = nodeOps.createElement('div')
    render(h(App), root)
    expect(d1.mounted).toHaveBeenCalled()
  })*/
})
