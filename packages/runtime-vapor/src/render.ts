import { markRaw, proxyRefs } from '@vue/reactivity'
import { invokeArrayFns, type Data } from '@vue/shared'
import {
  type Component,
  type ComponentInternalInstance,
  createComponentInstance,
  setCurrentInstance,
  unsetCurrentInstance,
} from './component'
import { initProps } from './componentProps'
import { invokeDirectiveHook } from './directive'
import { insert, remove } from './dom'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { initSlots } from './componentSlots'
import { Slot } from 'vue'

export type Block = Node | Fragment | Block[]
export type ParentBlock = ParentNode | Node[]
export type ChildBlock = Block | Slot | Record<string, Slot>
export type Fragment = { nodes: Block; anchor: Node }
export type BlockFn = (props: any, ctx: any) => Block

let isRenderingActivity = false
export function getIsRendering() {
  return isRenderingActivity
}

export function render(
  comp: Component,
  props: Data,
  children: ChildBlock,
  container: string | ParentNode,
): ComponentInternalInstance {
  const instance = createComponentInstance(comp, props)
  initProps(instance, props)
  initSlots(instance, children)
  return mountComponent(instance, (container = normalizeContainer(container)))
}

export function normalizeContainer(container: string | ParentNode): ParentNode {
  return typeof container === 'string'
    ? (document.querySelector(container) as ParentNode)
    : container
}

export function mountComponent(
  instance: ComponentInternalInstance,
  container: ParentNode,
) {
  instance.container = container

  setCurrentInstance(instance)
  const block = instance.scope.run(() => {
    const { component, props, emit, attrs, slots } = instance
    const ctx = { emit, attrs, slots, expose: () => {} }

    const setupFn =
      typeof component === 'function' ? component : component.setup
    instance.proxy = markRaw(
      new Proxy({ _: instance }, PublicInstanceProxyHandlers),
    )
    const state = setupFn && setupFn(props, ctx)
    let block: Block | null = null
    if (state && '__isScriptSetup' in state) {
      instance.setupState = proxyRefs(state)
      const currentlyRenderingActivity = isRenderingActivity
      isRenderingActivity = true
      try {
        block = component.render(instance.proxy)
      } finally {
        isRenderingActivity = currentlyRenderingActivity
      }
    } else {
      block = state as Block
    }
    if (block instanceof DocumentFragment) {
      block = Array.from(block.childNodes)
    }
    return (instance.block = block)
  })!
  const { bm, m } = instance

  // hook: beforeMount
  bm && invokeArrayFns(bm)
  invokeDirectiveHook(instance, 'beforeMount')

  insert(block, instance.container)
  instance.isMountedRef.value = true

  // hook: mounted
  invokeDirectiveHook(instance, 'mounted')
  m && invokeArrayFns(m)
  unsetCurrentInstance()

  return instance
}

export function unmountComponent(instance: ComponentInternalInstance) {
  const { container, block, scope, um, bum } = instance

  // hook: beforeUnmount
  bum && invokeArrayFns(bum)
  invokeDirectiveHook(instance, 'beforeUnmount')

  scope.stop()
  block && remove(block, container)
  instance.isMountedRef.value = false
  instance.isUnmountedRef.value = true

  // hook: unmounted
  invokeDirectiveHook(instance, 'unmounted')
  um && invokeArrayFns(um)
  unsetCurrentInstance()
}
