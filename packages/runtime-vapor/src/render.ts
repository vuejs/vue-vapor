import { markRaw, proxyRefs } from '@vue/reactivity'
import { type Data, invokeArrayFns, isArray, isObject } from '@vue/shared'
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
import { initSlots } from './componentSlots'
import type { Slot } from 'vue'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { queuePostRenderEffect } from './scheduler'

export type Block = Node | Fragment | Block[]
export type ParentBlock = ParentNode | Node[]
export type ChildBlock = Block | Slot | Record<string, Slot>
export type Fragment = { nodes: Block; anchor: Node }
export type BlockFn = (props?: any) => Block

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
    ? // eslint-disable-next-line no-restricted-globals
      (document.querySelector(container) as ParentNode)
    : container
}

export function mountComponent(
  instance: ComponentInternalInstance,
  container: ParentNode,
) {
  instance.container = container

  const reset = setCurrentInstance(instance)
  const block = instance.scope.run(() => {
    const { component, props, emit, attrs, slots } = instance
    const ctx = { emit, attrs, slots, expose: () => {} }
    instance.proxy = markRaw(
      new Proxy({ _: instance }, PublicInstanceProxyHandlers),
    )

    const setupFn =
      typeof component === 'function' ? component : component.setup
    const stateOrNode = setupFn && setupFn(props, ctx)

    let block: Block | undefined

    if (stateOrNode instanceof Node) {
      block = stateOrNode
    } else if (isObject(stateOrNode) && !isArray(stateOrNode)) {
      instance.setupState = proxyRefs(stateOrNode)
    }
    if (!block && component.render) {
      block = component.render(instance.setupState)
    }

    if (block instanceof DocumentFragment) {
      block = Array.from(block.childNodes)
    }
    if (!block) {
      // TODO: warn no template
      block = []
    }
    return (instance.block = block)
  })!
  const { bm, m } = instance

  // hook: beforeMount
  bm && invokeArrayFns(bm)
  invokeDirectiveHook(instance, 'beforeMount')

  insert(block, instance.container)
  instance.isMounted = true

  // hook: mounted
  queuePostRenderEffect(() => {
    invokeDirectiveHook(instance, 'mounted')
    m && invokeArrayFns(m)
  })
  reset()

  return instance
}

export function unmountComponent(instance: ComponentInternalInstance) {
  const { container, block, scope, um, bum } = instance

  // hook: beforeUnmount
  bum && invokeArrayFns(bum)
  invokeDirectiveHook(instance, 'beforeUnmount')

  scope.stop()
  block && remove(block, container)
  instance.isMounted = false
  instance.isUnmounted = true

  // hook: unmounted
  invokeDirectiveHook(instance, 'unmounted')
  um && invokeArrayFns(um)
  unsetCurrentInstance()
}
